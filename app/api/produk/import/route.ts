import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Parser CSV sederhana: cukup untuk format "kode,nama,kategori,harga,stok"
// tanpa koma di dalam nilai (nama menu dan kategori tidak boleh mengandung koma).
function parseCsv(teks: string) {
  const baris = teks.split(/\r?\n/).map((b) => b.trim()).filter(Boolean);
  if (baris.length === 0) return [];
  const header = baris[0].toLowerCase();
  const mulaiDari = header.includes("kode") || header.includes("nama") ? 1 : 0; // lewati baris judul kalau ada
  return baris.slice(mulaiDari).map((b, i) => {
    const kolom = b.split(",").map((k) => k.trim());
    return { baris: mulaiDari + i + 1, kode: kolom[0], nama: kolom[1], kategori: kolom[2], harga: kolom[3], stok: kolom[4] };
  });
}

// POST { csv: "kode,nama,kategori,harga,stok\n..." } -> import banyak produk sekaligus.
// Kode yang sudah ada akan DIPERBARUI (harga/stok/kategori/nama), bukan dobel.
export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { csv } = await req.json();
  if (typeof csv !== "string" || !csv.trim()) {
    return NextResponse.json({ error: "File CSV kosong" }, { status: 400 });
  }

  const baris = parseCsv(csv);
  if (baris.length === 0) return NextResponse.json({ error: "Tidak ada baris data" }, { status: 400 });
  if (baris.length > 500) return NextResponse.json({ error: "Maksimal 500 baris sekali import" }, { status: 400 });

  const errorBaris: string[] = [];
  let dibuat = 0;
  let diperbarui = 0;

  for (const b of baris) {
    const kode = (b.kode ?? "").trim();
    const nama = (b.nama ?? "").trim();
    const kategori = (b.kategori ?? "").trim() || null;
    const harga = Number(b.harga);
    const stok = Number(b.stok ?? 0);

    if (!kode || !nama || !Number.isFinite(harga) || harga < 0 || !Number.isFinite(stok) || stok < 0) {
      errorBaris.push(`Baris ${b.baris}: data tidak lengkap/valid (kode="${kode}", nama="${nama}")`);
      continue;
    }

    const ada = await prisma.product.findUnique({ where: { kode } });
    if (ada) {
      await prisma.product.update({ where: { kode }, data: { nama, kategori, harga, stok } });
      diperbarui++;
    } else {
      await prisma.product.create({ data: { kode, nama, kategori, harga, stok } });
      dibuat++;
    }
  }

  return NextResponse.json({ dibuat, diperbarui, totalBaris: baris.length, errorBaris });
}
