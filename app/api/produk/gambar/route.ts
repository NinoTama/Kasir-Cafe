import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { jenisGambar, unggahGambar, hapusGambar } from "@/lib/uploads";

const MAKS = 2 * 1024 * 1024; // 2 MB

// POST multipart: id (produk) + file (gambar). Hanya ADMIN. Disimpan ke Vercel Blob.
export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const fd = await req.formData();
  const id = Number(fd.get("id"));
  const file = fd.get("file");
  if (!Number.isInteger(id) || !(file instanceof File)) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  if (file.size > MAKS) return NextResponse.json({ error: "Ukuran maksimal 2 MB" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = jenisGambar(buf);
  if (!ext) return NextResponse.json({ error: "Format harus JPG, PNG, atau WebP" }, { status: 400 });

  const produk = await prisma.product.findUnique({ where: { id } });
  if (!produk) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  try {
    const url = await unggahGambar(id, buf, ext);
    await prisma.product.update({ where: { id }, data: { gambar: url } });
    if (produk.gambar) await hapusGambar(produk.gambar);
    return NextResponse.json({ gambar: url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal mengunggah ke penyimpanan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
