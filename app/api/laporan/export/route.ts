import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function awalHari(s: string) {
  return new Date(s + "T00:00:00+07:00");
}
function akhirHari(s: string) {
  return new Date(s + "T23:59:59+07:00");
}
function csvAman(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/laporan/export?dari=YYYY-MM-DD&sampai=YYYY-MM-DD -> unduh CSV (buka Excel)
export async function GET(req: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const url = new URL(req.url);
  const dari = url.searchParams.get("dari") ?? new Date().toISOString().slice(0, 10);
  const sampai = url.searchParams.get("sampai") ?? dari;

  const transaksi = await prisma.transaction.findMany({
    where: { createdAt: { gte: awalHari(dari), lte: akhirHari(sampai) } },
    include: { kasir: true, member: true, items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  const baris = [
    ["No Invoice", "Waktu", "Kasir", "Tipe", "Meja", "Member", "Menu", "Qty", "Harga Satuan", "Subtotal", "Diskon", "Potongan Poin", "Total", "Metode Bayar"].join(","),
  ];

  for (const t of transaksi) {
    const waktu = t.createdAt.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" });
    for (const it of t.items) {
      baris.push(
        [
          "#" + String(t.id).padStart(5, "0"),
          waktu,
          t.kasir.nama,
          t.tipe,
          t.meja ?? "",
          t.member?.nama ?? "",
          it.product.nama,
          it.qty,
          it.harga,
          t.subtotal,
          t.diskon,
          t.potonganPoin,
          t.total,
          t.metode,
        ]
          .map(csvAman)
          .join(",")
      );
    }
  }

  return new NextResponse(baris.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-${dari}_sampai_${sampai}.csv"`,
    },
  });
}
