import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { unggahGambar, hapusGambar } from "@/lib/uploads";

function jenisGambar(b: Buffer): "jpg" | "png" | "webp" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

const MAKS = 2 * 1024 * 1024;

/**
 * POST multipart: productId_<n> = id produk, file_<n> = foto, untuk n = 0..jumlah-1.
 * Dipakai oleh halaman import-foto (cocokkan manual lewat dropdown), beda dari
 * /api/produk/import-gambar lama yang mencocokkan lewat nama file.
 */
export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const fd = await req.formData();
  const berhasil: string[] = [];
  const gagal: string[] = [];

  let i = 0;
  while (fd.has(`file_${i}`)) {
    const file = fd.get(`file_${i}`);
    const idStr = fd.get(`productId_${i}`);
    const id = Number(idStr);

    if (!(file instanceof File) || !Number.isInteger(id)) {
      gagal.push(`Item ${i + 1}: data tidak valid`);
      i++;
      continue;
    }
    const produk = await prisma.product.findUnique({ where: { id } });
    if (!produk) {
      gagal.push(`${file.name}: produk tidak ditemukan`);
      i++;
      continue;
    }
    if (file.size > MAKS) {
      gagal.push(`${file.name}: lebih dari 2 MB`);
      i++;
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = jenisGambar(buf);
    if (!ext) {
      gagal.push(`${file.name}: format harus JPG/PNG/WebP`);
      i++;
      continue;
    }
    try {
      const url = await unggahGambar(produk.id, buf, ext);
      await prisma.product.update({ where: { id: produk.id }, data: { gambar: url } });
      if (produk.gambar) await hapusGambar(produk.gambar);
      berhasil.push(`${file.name} -> ${produk.nama}`);
    } catch {
      gagal.push(`${file.name}: gagal upload ke storage`);
    }
    i++;
  }

  return NextResponse.json({ berhasil, gagal });
}
