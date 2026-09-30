import { put, del } from "@vercel/blob";

const JENIS: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export function jenisGambar(b: Buffer): "jpg" | "png" | "webp" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

/** Unggah foto menu ke Vercel Blob (jalan di lokal maupun setelah di-deploy). Return URL publiknya. */
export async function unggahGambar(id: number, buf: Buffer, ext: string) {
  const nama = `menu/${id}-${Date.now()}.${ext}`;
  const hasil = await put(nama, buf, {
    access: "public",
    contentType: JENIS[ext],
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return hasil.url;
}

export async function hapusGambar(url: string | null) {
  if (!url) return;
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {});
}
