import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET -> daftar ringkas semua produk (id, nama, kode), buat isi dropdown.
export async function GET() {
  try {
    await requireRole("ADMIN", "KASIR");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  const produk = await prisma.product.findMany({
    select: { id: true, nama: true, kode: true },
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(produk);
}
