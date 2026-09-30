"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Kecilkan foto (maks 800px, WebP) sebelum diunggah, supaya foto HP yang besar tetap ringan
async function kecilkan(file: File, maks = 800): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const skala = Math.min(1, maks / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * skala);
  c.height = Math.round(bmp.height * skala);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Gambar tidak bisa diproses"))), "image/webp", 0.82));
}

export default function UploadGambar({ id, gambar }: { id: number; gambar: string | null }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErr("");
    try {
      const blob = await kecilkan(file);
      const fd = new FormData();
      fd.append("id", String(id));
      fd.append("file", new File([blob], "menu.webp", { type: "image/webp" }));
      const r = await fetch("/api/produk/gambar", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Gagal mengunggah");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex w-24 shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={loading}
        className="h-20 w-20 overflow-hidden rounded-xl border border-line bg-cream text-xs text-ink/50 transition hover:border-pine"
      >
        {gambar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gambar} alt="" className="h-full w-full object-cover" />
        ) : (
          "+ Foto"
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" onChange={pilih} hidden />
      <span className="text-[10px] text-ink/50">{loading ? "Mengunggah..." : gambar ? "Klik untuk ganti" : ""}</span>
      {err && <span className="text-center text-[10px] text-red-500">{err}</span>}
    </div>
  );
}
