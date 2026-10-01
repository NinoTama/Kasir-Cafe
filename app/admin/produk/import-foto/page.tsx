"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Produk = { id: number; nama: string; kode: string };
type ItemFoto = {
  id: string;
  file: File;
  previewUrl: string;
  productId: number | null;
};

export default function ImportFotoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [items, setItems] = useState<ItemFoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<{ berhasil: string[]; gagal: string[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/produk/daftar")
      .then((r) => r.json())
      .then(setProdukList)
      .catch(() => setError("Gagal memuat daftar menu"));
  }, []);

  function tambahFile(fileList: FileList | null) {
    if (!fileList) return;
    const baru: ItemFoto[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      previewUrl: URL.createObjectURL(file),
      productId: null,
    }));
    setItems((cur) => [...cur, ...baru]);
    setHasil(null);
  }

  function ubahProduk(id: string, productId: number) {
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, productId } : it)));
  }

  function hapusItem(id: string) {
    setItems((cur) => cur.filter((it) => it.id !== id));
  }

  const siapDiterapkan = items.filter((it) => it.productId !== null);
  const belumDipilih = items.length - siapDiterapkan.length;

  async function terapkanSemua() {
    if (siapDiterapkan.length === 0) return;
    setLoading(true);
    setError("");
    setHasil(null);
    try {
      const fd = new FormData();
      siapDiterapkan.forEach((it, i) => {
        fd.append(`file_${i}`, it.file);
        fd.append(`productId_${i}`, String(it.productId));
      });
      const r = await fetch("/api/produk/import-gambar", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Gagal upload");
      setHasil(d);
      setItems((cur) => cur.filter((it) => it.productId === null)); // sisakan yang belum dipilih
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl text-pine">Pasang Foto Menu</div>
          <Link href="/admin/produk" className="text-sm text-pine underline">← Menu & Stok</Link>
        </div>

        <div className="space-y-3 rounded-2xl border border-line bg-paper p-5 shadow-sm">
          <p className="text-sm text-ink/70">
            Upload foto-foto sekaligus (nama file bebas, tidak perlu diubah), lalu pilih menu untuk
            tiap foto lewat dropdown di bawahnya. Terakhir klik satu tombol untuk memasang semuanya.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              tambahFile(e.target.files);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="block w-full text-sm"
          />
        </div>

        {error && <p className="rounded-lg border border-brick/30 bg-brick/10 p-2.5 text-sm text-brick-dark">{error}</p>}

        {hasil && (
          <div className="space-y-2 rounded-lg border border-pine/30 bg-pine/10 p-3 text-sm">
            <p><b>{hasil.berhasil.length}</b> foto berhasil dipasang.</p>
            {hasil.gagal.length > 0 && (
              <div className="text-brick-dark">
                <p>{hasil.gagal.length} gagal:</p>
                <ul className="list-disc pl-5">
                  {hasil.gagal.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.previewUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-ink/50">{it.file.name}</p>
                  <select
                    value={it.productId ?? ""}
                    onChange={(e) => ubahProduk(it.id, Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-line bg-white p-2 text-sm outline-none focus:border-pine"
                  >
                    <option value="" disabled>Pilih menu...</option>
                    {produkList.map((p) => (
                      <option key={p.id} value={p.id}>{p.kode} — {p.nama}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => hapusItem(it.id)} className="shrink-0 text-xs text-brick underline">
                  Hapus
                </button>
              </div>
            ))}

            <button
              disabled={loading || siapDiterapkan.length === 0}
              onClick={terapkanSemua}
              className="w-full rounded-lg bg-pine p-3 text-sm font-medium text-cream transition hover:bg-pine-dark disabled:opacity-40"
            >
              {loading
                ? "Memasang foto..."
                : `Pasang ${siapDiterapkan.length} foto${belumDipilih > 0 ? ` (${belumDipilih} belum pilih menu)` : ""}`}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
