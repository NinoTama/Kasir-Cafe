import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { hitungTotal } from "@/lib/pricing";

/**
 * POST /api/transactions
 * body: { items: [{productId, qty}], memberId?: number, pakaiPoin?: number, bayar: number }
 * Harga, diskon, poin, dan stok semua dihitung di server (tidak percaya angka dari browser).
 */
export async function POST(req: Request) {
  let session;
  try {
    session = await requireRole("ADMIN", "KASIR");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const bayar = Number(body.bayar ?? 0);
  const metode = ["TUNAI", "QRIS", "DEBIT", "TRANSFER"].includes(body.metode) ? (body.metode as string) : "TUNAI";
  const tipe = body.tipe === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN";
  const meja = String(body.meja ?? "").trim().slice(0, 10) || null;
  const pakaiPoin = Number(body.pakaiPoin ?? 0);
  const memberId = body.memberId ? Number(body.memberId) : null;

  // validasi tiap baris pesanan (TIDAK digabung, supaya catatan per baris tidak hilang)
  type BarisMasuk = { productId: number; qty: number; catatan: string | null };
  const barisMasuk: BarisMasuk[] = [];
  const qtyPerProduk = new Map<number, number>(); // dipakai untuk mengurangi stok per produk
  for (const it of Array.isArray(body.items) ? body.items : []) {
    const id = Number(it.productId);
    const qty = Number(it.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: "Item tidak valid" }, { status: 400 });
    }
    const catatan = String(it.catatan ?? "").trim().slice(0, 200) || null;
    barisMasuk.push({ productId: id, qty, catatan });
    qtyPerProduk.set(id, (qtyPerProduk.get(id) ?? 0) + qty);
  }
  if (barisMasuk.length === 0 || !Number.isInteger(bayar) || !Number.isInteger(pakaiPoin) || pakaiPoin < 0) {
    return NextResponse.json({ error: "Data transaksi tidak valid" }, { status: 400 });
  }

  const settings = await getSettings();

  try {
    const hasil = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: Array.from(qtyPerProduk.keys()) } } });
      if (products.length !== qtyPerProduk.size) throw new Error("Ada produk yang tidak ditemukan");

      // kurangi stok per produk (gagal kalau stok tidak cukup, aman dari race condition)
      const hargaProduk = new Map(products.map((p) => [p.id, p.harga]));
      for (const p of products) {
        const qty = qtyPerProduk.get(p.id)!;
        const r = await tx.product.updateMany({
          where: { id: p.id, stok: { gte: qty } },
          data: { stok: { decrement: qty } },
        });
        if (r.count === 0) throw new Error(`Stok "${p.nama}" tidak cukup`);
      }

      // baris transaksi dibuat per baris ASLI (bukan hasil gabungan), supaya catatan tiap baris tetap terpisah
      let subtotal = 0;
      const lines = barisMasuk.map((b) => {
        const harga = hargaProduk.get(b.productId)!;
        subtotal += harga * b.qty;
        return { productId: b.productId, qty: b.qty, harga, catatan: b.catatan };
      });

      const member = memberId ? await tx.member.findUnique({ where: { id: memberId } }) : null;
      if (memberId && !member) throw new Error("Member tidak ditemukan");

      const h = hitungTotal(subtotal, member, pakaiPoin, settings);
      if (metode === "TUNAI" && bayar < h.total) throw new Error("Uang bayar kurang");
      const dibayar = metode === "TUNAI" ? bayar : h.total; // non-tunai = pas

      if (member) {
        if (h.poinDipakai > 0) {
          const r = await tx.member.updateMany({
            where: { id: member.id, poin: { gte: h.poinDipakai } },
            data: { poin: { decrement: h.poinDipakai } },
          });
          if (r.count === 0) throw new Error("Poin member tidak cukup");
        }
        if (h.poinDidapat > 0) {
          await tx.member.update({ where: { id: member.id }, data: { poin: { increment: h.poinDidapat } } });
        }
      }

      return tx.transaction.create({
        data: {
          kasirId: Number(session.user.id),
          memberId: member?.id ?? null,
          subtotal: h.subtotal,
          diskon: h.diskon,
          potonganPoin: h.potonganPoin,
          poinDipakai: h.poinDipakai,
          poinDidapat: h.poinDidapat,
          total: h.total,
          bayar: dibayar,
          kembalian: dibayar - h.total,
          metode,
          tipe: tipe as string,
          meja: tipe === "DINE_IN" ? meja : null,
          items: { create: lines },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal menyimpan transaksi";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
