import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UploadGambar from "@/components/UploadGambar";
import { hapusGambar } from "@/lib/uploads";
import { KATEGORI_SARAN, ikonKategori } from "@/lib/categories";
import { rp } from "@/lib/format";

function gagal(msg: string): never {
  redirect("/admin/produk?err=" + encodeURIComponent(msg));
}

function baca(fd: FormData) {
  const nama = String(fd.get("nama") ?? "").trim();
  const kode = String(fd.get("kode") ?? "").trim();
  const kategori = String(fd.get("kategori") ?? "").trim() || null;
  const harga = Number(fd.get("harga"));
  const stok = Number(fd.get("stok"));
  if (!nama || !kode || !Number.isInteger(harga) || harga < 0 || !Number.isInteger(stok) || stok < 0) {
    gagal("Data tidak valid (nama, kode wajib; harga & stok harus angka bulat ≥ 0)");
  }
  return { nama, kode, kategori, harga, stok };
}

async function tambah(fd: FormData) {
  "use server";
  await requireRole("ADMIN");
  const d = baca(fd);
  if (await prisma.product.findUnique({ where: { kode: d.kode } })) gagal("Kode produk sudah dipakai");
  await prisma.product.create({ data: d });
  revalidatePath("/admin/produk");
}

async function ubah(fd: FormData) {
  "use server";
  await requireRole("ADMIN");
  const id = Number(fd.get("id"));
  const d = baca(fd);
  const bentrok = await prisma.product.findFirst({ where: { kode: d.kode, NOT: { id } } });
  if (bentrok) gagal("Kode produk sudah dipakai produk lain");
  await prisma.product.update({ where: { id }, data: d });
  revalidatePath("/admin/produk");
}

async function hapus(fd: FormData) {
  "use server";
  await requireRole("ADMIN");
  const id = Number(fd.get("id"));
  const dipakai = await prisma.transactionItem.count({ where: { productId: id } });
  if (dipakai > 0) gagal("Produk sudah pernah terjual, tidak bisa dihapus. Set stok ke 0 saja.");
  const lama = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  if (lama?.gambar) await hapusGambar(lama.gambar);
  revalidatePath("/admin/produk");
}

const input = "w-full rounded-lg border border-line bg-white p-2 text-sm outline-none focus:border-pine";

export default async function ProdukPage({ searchParams }: { searchParams: { err?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const products = await prisma.product.findMany({ orderBy: [{ kategori: "asc" }, { nama: "asc" }] });
  const kategoriDipakai = Array.from(new Set(products.map((p) => p.kategori).filter(Boolean))) as string[];
  const opsiKategori = Array.from(new Set([...kategoriDipakai, ...KATEGORI_SARAN]));

  const kelompok = new Map<string, typeof products>();
  for (const p of products) {
    const k = p.kategori || "Belum dikategorikan";
    kelompok.set(k, [...(kelompok.get(k) ?? []), p]);
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-2xl text-pine">Menu & Stok</div>
            <p className="text-sm text-ink/60">{products.length} menu terdaftar</p>
          </div>
          <Link href="/admin" className="text-sm text-pine underline">← Dashboard</Link>
        </div>

        {searchParams.err && (
          <p className="rounded-lg border border-brick/30 bg-brick/10 p-2.5 text-sm text-brick-dark">{searchParams.err}</p>
        )}

        <datalist id="daftar-kategori">
          {opsiKategori.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>

        <form action={tambah} className="grid gap-2 rounded-2xl border border-line bg-paper p-4 shadow-sm sm:grid-cols-6">
          <input name="kode" placeholder="Kode" className={input} required />
          <input name="nama" placeholder="Nama menu" className={`${input} sm:col-span-2`} required />
          <input name="kategori" placeholder="Kategori" list="daftar-kategori" className={input} />
          <input name="harga" type="number" min={0} placeholder="Harga" className={input} required />
          <input name="stok" type="number" min={0} placeholder="Stok" className={input} required />
          <button className="rounded-lg bg-pine p-2 text-sm font-medium text-cream transition hover:bg-pine-dark sm:col-span-6">
            + Tambah menu
          </button>
        </form>

        {products.length === 0 && <p className="text-ink/60">Belum ada menu. Tambahkan lewat form di atas.</p>}

        {Array.from(kelompok.entries()).map(([nama, list]) => (
          <section key={nama} className="space-y-2">
            <h2 className="flex items-center gap-2 font-display text-lg text-pine">
              <span>{ikonKategori(nama)}</span> {nama}
              <span className="text-sm font-sans font-normal text-ink/50">({list.length})</span>
            </h2>
            <div className="space-y-2">
              {list.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-3 shadow-sm sm:flex-row sm:items-center"
                >
                  <UploadGambar id={p.id} gambar={p.gambar} />
                  <form action={ubah} className="grid flex-1 gap-2 sm:grid-cols-8">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="kode" defaultValue={p.kode} className={input} />
                    <input name="nama" defaultValue={p.nama} className={`${input} sm:col-span-2`} />
                    <input name="kategori" defaultValue={p.kategori ?? ""} list="daftar-kategori" className={input} />
                    <input name="harga" type="number" min={0} defaultValue={p.harga} className={`${input} tabular`} />
                    <input
                      name="stok"
                      type="number"
                      min={0}
                      defaultValue={p.stok}
                      className={`${input} tabular ${p.stok <= 5 ? "border-brick text-brick-dark" : ""}`}
                    />
                    <div className="flex gap-2 sm:col-span-1">
                      <button className="flex-1 rounded-lg bg-pine px-2 text-sm text-cream transition hover:bg-pine-dark">
                        Simpan
                      </button>
                      <button
                        formAction={hapus}
                        className="rounded-lg border border-brick/40 px-2 text-sm text-brick-dark transition hover:bg-brick/10"
                      >
                        Hapus
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
