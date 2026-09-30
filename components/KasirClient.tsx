"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hitungTotal } from "@/lib/pricing";
import type { Settings } from "@/lib/settings";
import { rp } from "@/lib/format";
import { ikonKategori } from "@/lib/categories";
import CatatanItem from "@/components/CatatanItem";

type Produk = { id: number; nama: string; kode: string; harga: number; stok: number; kategori: string | null; gambar: string | null };
type Member = { id: number; nama: string; noHp: string; poin: number };
type Baris = { id: string; productId: number; qty: number; catatan: string };

const METODE = ["TUNAI", "QRIS", "DEBIT", "TRANSFER"] as const;
const box = "rounded-lg border border-line bg-white p-2 text-sm outline-none focus:border-pine";
const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const uid = () => Math.random().toString(36).slice(2, 9);

export default function KasirClient({ products, settings }: { products: Produk[]; settings: Settings }) {
  const router = useRouter();
  const [kat, setKat] = useState("Semua");
  const [cari, setCari] = useState("");
  const [cart, setCart] = useState<Baris[]>([]);
  const [catatanTerbuka, setCatatanTerbuka] = useState<string | null>(null);
  const [tipe, setTipe] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [meja, setMeja] = useState("");
  const [qMember, setQMember] = useState("");
  const [hasilMember, setHasilMember] = useState<Member[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [daftar, setDaftar] = useState(false);
  const [namaBaru, setNamaBaru] = useState("");
  const [pakaiPoin, setPakaiPoin] = useState(0);
  const [metode, setMetode] = useState<(typeof METODE)[number]>("TUNAI");
  const [bayar, setBayar] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const kategori = useMemo(
    () => ["Semua", ...Array.from(new Set(products.map((p) => p.kategori || "Lainnya")))],
    [products]
  );
  const tampil = products.filter(
    (p) =>
      (kat === "Semua" || (p.kategori || "Lainnya") === kat) &&
      (p.nama + p.kode).toLowerCase().includes(cari.toLowerCase())
  );

  const totalQtyProduk = (productId: number) => cart.filter((b) => b.productId === productId).reduce((a, b) => a + b.qty, 0);

  const lines = cart.map((b) => ({ b, p: products.find((x) => x.id === b.productId)! })).filter((l) => l.p);
  const subtotal = lines.reduce((a, l) => a + l.p.harga * l.b.qty, 0);
  const h = hitungTotal(subtotal, member, pakaiPoin, settings);
  const dibayar = metode === "TUNAI" ? bayar : h.total;
  const bisaBayar = lines.length > 0 && dibayar >= h.total && !loading;

  useEffect(() => {
    if (member || qMember.trim().length < 2) {
      setHasilMember([]);
      return;
    }
    const t = setTimeout(async () => {
      const r = await fetch("/api/members?q=" + encodeURIComponent(qMember.trim()));
      if (r.ok) setHasilMember(await r.json());
    }, 300);
    return () => clearTimeout(t);
  }, [qMember, member]);

  // Klik kartu menu: tambah ke baris kosong (tanpa catatan) yang sudah ada, atau buat baris baru.
  function tambah(p: Produk) {
    if (totalQtyProduk(p.id) >= p.stok) return;
    setCart((c) => {
      const ada = c.find((b) => b.productId === p.id && b.catatan === "");
      if (ada) return c.map((b) => (b.id === ada.id ? { ...b, qty: b.qty + 1 } : b));
      return [...c, { id: uid(), productId: p.id, qty: 1, catatan: "" }];
    });
  }
  function kurangBaris(id: string) {
    setCart((c) => c.flatMap((b) => (b.id !== id ? [b] : b.qty > 1 ? [{ ...b, qty: b.qty - 1 }] : [])));
  }
  function tambahBaris(id: string, stok: number) {
    setCart((c) => {
      const b = c.find((x) => x.id === id);
      if (!b || totalQtyProduk(b.productId) >= stok) return c;
      return c.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x));
    });
  }
  function hapusBaris(id: string) {
    setCart((c) => c.filter((b) => b.id !== id));
  }
  function ubahCatatan(id: string, catatan: string) {
    setCart((c) => c.map((b) => (b.id === id ? { ...b, catatan } : b)));
  }
  // Untuk pesanan sama tapi request beda (mis. 1 less sugar, 1 no sugar): pisah satu unit jadi baris baru.
  function pisahDenganCatatan(b: Baris) {
    setCart((c) =>
      c.flatMap((x) => (x.id !== b.id ? [x] : x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : [])).concat({ id: uid(), productId: b.productId, qty: 1, catatan: "" })
    );
    setCatatanTerbuka((cur) => cur); // biarkan panel yang baru dibuka lewat klik tombol catatan baris baru
  }

  async function daftarMember() {
    setError("");
    const r = await post("/api/members", { nama: namaBaru, noHp: qMember });
    const d = await r.json();
    if (!r.ok) return setError(d.error ?? "Gagal mendaftarkan member");
    setMember(d);
    setDaftar(false);
    setNamaBaru("");
  }

  async function proses() {
    setLoading(true);
    setError("");
    const r = await post("/api/transactions", {
      items: cart.map((b) => ({ productId: b.productId, qty: b.qty, catatan: b.catatan })),
      memberId: member?.id,
      pakaiPoin,
      bayar,
      metode,
      tipe,
      meja,
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Gagal menyimpan transaksi");
      setLoading(false);
      return;
    }
    router.push("/kasir/struk/" + d.id);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      {/* MENU */}
      <section className="space-y-3">
        <input
          className={`${box} w-full`}
          placeholder="Cari menu..."
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {kategori.map((k) => (
            <button
              key={k}
              onClick={() => setKat(k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                kat === k ? "border-pine bg-pine text-cream" : "border-line bg-paper text-ink/70 hover:border-pine/50"
              }`}
            >
              {k !== "Semua" && <span>{ikonKategori(k)}</span>}
              {k}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {tampil.map((p) => {
            const diKeranjang = totalQtyProduk(p.id);
            const habis = p.stok <= 0;
            return (
              <button
                key={p.id}
                disabled={habis || diKeranjang >= p.stok}
                onClick={() => tambah(p)}
                className="group overflow-hidden rounded-2xl border border-line bg-paper text-left shadow-sm transition hover:-translate-y-0.5 hover:border-pine hover:shadow-md disabled:translate-y-0 disabled:opacity-40 disabled:hover:shadow-sm"
              >
                <div className="relative h-28 w-full bg-cream">
                  {p.gambar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.gambar} alt={p.nama} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">{ikonKategori(p.kategori)}</div>
                  )}
                  {diKeranjang > 0 && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brick text-xs font-medium text-cream">
                      {diKeranjang}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="text-sm font-medium leading-tight text-ink">{p.nama}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="tabular text-sm text-pine">{rp(p.harga)}</span>
                    <span className="text-xs text-ink/40">{habis ? "Habis" : `Stok ${p.stok}`}</span>
                  </div>
                </div>
              </button>
            );
          })}
          {tampil.length === 0 && <p className="col-span-full text-ink/50">Menu tidak ditemukan.</p>}
        </div>
      </section>

      {/* KERANJANG */}
      <aside className="space-y-4 rounded-2xl border border-line bg-paper p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-lg text-pine">Pesanan</h2>
        {lines.length === 0 && <p className="text-sm text-ink/50">Belum ada item. Ketuk menu di sebelah kiri.</p>}
        <div className="space-y-2">
          {lines.map(({ b, p }) => (
            <div key={b.id} className="space-y-1.5 border-b border-line pb-2 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1">
                  <div className="text-ink">{p.nama}</div>
                  <div className="tabular text-ink/50">{rp(p.harga)}</div>
                </div>
                <button onClick={() => kurangBaris(b.id)} className="h-7 w-7 rounded-full border border-line text-ink/70 hover:border-pine">−</button>
                <span className="tabular w-6 text-center">{b.qty}</span>
                <button
                  onClick={() => tambahBaris(b.id, p.stok)}
                  disabled={totalQtyProduk(p.id) >= p.stok}
                  className="h-7 w-7 rounded-full border border-line text-ink/70 hover:border-pine disabled:opacity-30"
                >
                  +
                </button>
                <span className="tabular w-20 text-right text-ink">{rp(p.harga * b.qty)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-0.5 text-xs">
                <button
                  onClick={() => setCatatanTerbuka(catatanTerbuka === b.id ? null : b.id)}
                  className="text-pine underline"
                >
                  {b.catatan ? "Catatan: " + b.catatan : "+ Catatan"}
                </button>
                {b.qty > 1 && (
                  <button onClick={() => pisahDenganCatatan(b)} className="text-ink/40 underline">
                    pisah 1 dgn catatan beda
                  </button>
                )}
                <button onClick={() => hapusBaris(b.id)} className="text-brick/70 underline">
                  hapus
                </button>
              </div>

              {catatanTerbuka === b.id && (
                <CatatanItem catatan={b.catatan} onChange={(v) => ubahCatatan(b.id, v)} />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-line pt-4">
          {(["DINE_IN", "TAKEAWAY"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipe(t)}
              className={`flex-1 rounded-lg border p-2 text-sm transition ${
                tipe === t ? "border-pine bg-pine text-cream" : "border-line text-ink/70"
              }`}
            >
              {t === "DINE_IN" ? "Dine in" : "Take away"}
            </button>
          ))}
        </div>
        {tipe === "DINE_IN" && (
          <input className={`${box} w-full`} placeholder="No. meja" value={meja} onChange={(e) => setMeja(e.target.value)} />
        )}

        {/* MEMBER */}
        <div className="space-y-2 border-t border-line pt-4">
          {member ? (
            <div className="flex items-center justify-between rounded-lg bg-gold/10 p-2.5 text-sm">
              <div>
                <b className="text-ink">{member.nama}</b>
                <span className="text-ink/60"> · {member.poin} poin</span>
              </div>
              <button
                onClick={() => {
                  setMember(null);
                  setPakaiPoin(0);
                  setQMember("");
                }}
                className="text-brick underline"
              >
                Lepas
              </button>
            </div>
          ) : (
            <>
              <input
                className={`${box} w-full`}
                placeholder="Member? cari nama / no HP"
                value={qMember}
                onChange={(e) => setQMember(e.target.value)}
              />
              {hasilMember.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMember(m)}
                  className="block w-full rounded-lg border border-line p-2 text-left text-sm hover:border-pine"
                >
                  {m.nama} · {m.noHp} · {m.poin} poin
                </button>
              ))}
              {qMember.trim().length >= 8 && hasilMember.length === 0 && (
                <>
                  <button onClick={() => setDaftar(!daftar)} className="text-sm text-pine underline">
                    Daftarkan {qMember} sebagai member baru
                  </button>
                  {daftar && (
                    <div className="flex gap-2">
                      <input
                        className={`${box} flex-1`}
                        placeholder="Nama member"
                        value={namaBaru}
                        onChange={(e) => setNamaBaru(e.target.value)}
                      />
                      <button onClick={daftarMember} className="rounded-lg bg-pine px-3 text-sm text-cream">
                        Simpan
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {member && member.poin >= settings.min_poin_tukar && settings.min_poin_tukar >= 0 && (
            <label className="block text-sm">
              <span className="text-ink/70">Tukar poin (1 poin = {rp(settings.nilai_poin)})</span>
              <input
                type="number"
                min={0}
                max={member.poin}
                value={pakaiPoin}
                onChange={(e) => setPakaiPoin(Math.max(0, Number(e.target.value) || 0))}
                className={`${box} mt-1 w-full`}
              />
            </label>
          )}
        </div>

        {/* TOTAL */}
        <div className="space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-ink/70"><span>Subtotal</span><span className="tabular">{rp(h.subtotal)}</span></div>
          {h.diskon > 0 && (
            <div className="flex justify-between text-ink/70"><span>Diskon member</span><span className="tabular">-{rp(h.diskon)}</span></div>
          )}
          {h.potonganPoin > 0 && (
            <div className="flex justify-between text-ink/70">
              <span>Tukar {h.poinDipakai} poin</span><span className="tabular">-{rp(h.potonganPoin)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-display text-lg text-pine">
            <span>Total</span><span className="tabular">{rp(h.total)}</span>
          </div>
          {member && <div className="text-ink/50">Poin didapat: +{h.poinDidapat}</div>}
        </div>

        {/* PEMBAYARAN */}
        <div className="space-y-2 border-t border-line pt-4">
          <div className="grid grid-cols-4 gap-1.5">
            {METODE.map((m) => (
              <button
                key={m}
                onClick={() => setMetode(m)}
                className={`rounded-lg border p-1.5 text-xs transition ${
                  metode === m ? "border-pine bg-pine text-cream" : "border-line text-ink/70"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {metode === "TUNAI" ? (
            <>
              <input
                type="number"
                min={0}
                value={bayar || ""}
                onChange={(e) => setBayar(Number(e.target.value) || 0)}
                placeholder="Uang diterima"
                className={`${box} w-full`}
              />
              <div className="flex gap-2">
                {[h.total, 50000, 100000].map((n, i) => (
                  <button key={i} onClick={() => setBayar(n)} className="flex-1 rounded-lg border border-line p-1.5 text-xs text-ink/70 hover:border-pine">
                    {i === 0 ? "Uang pas" : rp(n)}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-ink/70">
                <span>Kembalian</span>
                <span className="tabular">{rp(Math.max(0, bayar - h.total))}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink/60">
              Pembayaran {metode} sebesar <span className="tabular">{rp(h.total)}</span> (pas).
            </p>
          )}
        </div>

        {error && <p className="rounded-lg border border-brick/30 bg-brick/10 p-2 text-sm text-brick-dark">{error}</p>}
        <button
          disabled={!bisaBayar}
          onClick={proses}
          className="w-full rounded-lg bg-brick p-3 font-medium text-cream transition hover:bg-brick-dark disabled:opacity-40"
        >
          {loading ? "Memproses..." : `Bayar ${rp(h.total)}`}
        </button>
      </aside>
    </div>
  );
}
