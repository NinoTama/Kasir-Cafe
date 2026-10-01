"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CONTOH = `kode,nama,kategori,harga,stok
K01,Espresso Singolo,Kopi,18000,50
K06,Caffe Latte,Kopi,25000,50
Z01,Pizza Margherita,Pizza,65000,20
D01,Tiramisu,Dessert,35000,15`;

export default function ImportProdukPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [teks, setTeks] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<{ dibuat: number; diperbarui: number; totalBaris: number; errorBaris: string[] } | null>(null);
  const [error, setError] = useState("");

  function pilihFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTeks(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function proses() {
    setLoading(true);
    setError("");
    setHasil(null);
    try {
      const r = await fetch("/api/produk/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: teks }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Gagal import");
      setHasil(d);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal import");
    } finally {
      setLoading(false);
    }
  }

  function unduhContoh() {
    const blob = new Blob([CONTOH], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contoh-menu.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl text-pine">Import Menu dari CSV</div>
          <Link href="/admin/produk" className="text-sm text-pine underline">← Menu & Stok</Link>
        </div>

        <div className="space-y-3 rounded-2xl border border-line bg-paper p-5 shadow-sm">
          <p className="text-sm text-ink/70">
            Siapkan file CSV dengan 5 kolom: <b>kode, nama, kategori, harga, stok</b> (boleh
            dibuat di Excel/Google Sheets, lalu simpan/export sebagai CSV). Kode yang sudah ada
            akan diperbarui datanya, kode baru akan dibuat sebagai menu baru.
          </p>
          <button onClick={unduhContoh} className="text-sm text-pine underline">
            Unduh contoh file CSV
          </button>

          <div className="space-y-2 border-t border-line pt-3">
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={pilihFile} className="text-sm" />
            <textarea
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              rows={8}
              placeholder="Atau tempel langsung isi CSV di sini..."
              className="w-full rounded-lg border border-line bg-white p-2 font-mono text-xs outline-none focus:border-pine"
            />
          </div>

          {error && <p className="rounded-lg border border-brick/30 bg-brick/10 p-2.5 text-sm text-brick-dark">{error}</p>}

          {hasil && (
            <div className="space-y-1 rounded-lg border border-pine/30 bg-pine/10 p-3 text-sm">
              <p>
                Selesai: <b>{hasil.dibuat}</b> menu baru dibuat, <b>{hasil.diperbarui}</b> menu diperbarui, dari {hasil.totalBaris} baris.
              </p>
              {hasil.errorBaris.length > 0 && (
                <div className="text-brick-dark">
                  <p>{hasil.errorBaris.length} baris dilewati:</p>
                  <ul className="list-disc pl-5">
                    {hasil.errorBaris.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            disabled={loading || !teks.trim()}
            onClick={proses}
            className="w-full rounded-lg bg-pine p-2.5 text-sm font-medium text-cream transition hover:bg-pine-dark disabled:opacity-40"
          >
            {loading ? "Memproses..." : "Import sekarang"}
          </button>
        </div>
      </div>
    </main>
  );
}
