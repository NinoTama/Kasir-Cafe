import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rp } from "@/lib/format";
import TrenChart from "@/components/admin/TrenChart";
import TopProdukChart from "@/components/admin/TopProdukChart";

function tglInput(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD untuk value input type=date
}

function awalHari(s: string) {
  const d = new Date(s + "T00:00:00+07:00");
  return isNaN(d.getTime()) ? null : d;
}
function akhirHari(s: string) {
  const d = new Date(s + "T23:59:59+07:00");
  return isNaN(d.getTime()) ? null : d;
}

export default async function LaporanPage({ searchParams }: { searchParams: { dari?: string; sampai?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const hariIni = tglInput(new Date());
  const dari = searchParams.dari || hariIni;
  const sampai = searchParams.sampai || hariIni;
  const gte = awalHari(dari) ?? new Date();
  const lte = akhirHari(sampai) ?? new Date();

  const transaksi = await prisma.transaction.findMany({
    where: { createdAt: { gte, lte } },
    include: { kasir: true, member: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const omzet = transaksi.reduce((a, t) => a + t.total, 0);
  const jumlahItem = transaksi.reduce((a, t) => a + t.items.reduce((b, i) => b + i.qty, 0), 0);
  const perMetode = new Map<string, { jumlah: number; total: number }>();
  for (const t of transaksi) {
    const cur = perMetode.get(t.metode) ?? { jumlah: 0, total: 0 };
    cur.jumlah += 1;
    cur.total += t.total;
    perMetode.set(t.metode, cur);
  }

  // data untuk grafik tren (urut tanggal naik, format singkat dd/mm)
  const perTanggal = new Map<string, number>();
  for (const t of transaksi) {
    const key = t.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", timeZone: "Asia/Jakarta" });
    perTanggal.set(key, (perTanggal.get(key) ?? 0) + t.total);
  }
  const dataTren = Array.from(perTanggal.entries())
    .map(([tanggal, total]) => ({ tanggal, total }))
    .sort((a, b) => {
      const [da, ma] = a.tanggal.split("/").map(Number);
      const [db, mb] = b.tanggal.split("/").map(Number);
      return ma - mb || da - db;
    });

  // data untuk grafik menu terlaris
  const perProduk = new Map<string, number>();
  for (const t of transaksi) for (const it of t.items) perProduk.set(it.product.nama, (perProduk.get(it.product.nama) ?? 0) + it.qty);
  const dataTopProduk = Array.from(perProduk.entries())
    .map(([nama, qty]) => ({ nama, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)
    .reverse(); // supaya batang terbesar ada di atas pada bar chart horizontal

  const q = `dari=${dari}&sampai=${sampai}`;

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-2xl text-pine">Laporan Penjualan</div>
            <p className="text-sm text-ink/60">{transaksi.length} transaksi</p>
          </div>
          <Link href="/admin" className="text-sm text-pine underline">← Dashboard</Link>
        </div>

        <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-paper p-4 shadow-sm">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">Dari</span>
            <input type="date" name="dari" defaultValue={dari} className="rounded-lg border border-line bg-white p-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">Sampai</span>
            <input type="date" name="sampai" defaultValue={sampai} className="rounded-lg border border-line bg-white p-2" />
          </label>
          <button className="rounded-lg bg-pine px-4 py-2 text-sm text-cream hover:bg-pine-dark">Tampilkan</button>
          <a href={`/api/laporan/export?${q}`} className="rounded-lg border border-line px-4 py-2 text-sm text-ink/70 hover:border-pine">
            Unduh CSV
          </a>
        </form>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
            <div className="text-sm text-ink/60">Total Omzet</div>
            <div className="tabular font-display text-2xl text-pine">{rp(omzet)}</div>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
            <div className="text-sm text-ink/60">Jumlah Transaksi</div>
            <div className="tabular font-display text-2xl text-pine">{transaksi.length}</div>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
            <div className="text-sm text-ink/60">Item Terjual</div>
            <div className="tabular font-display text-2xl text-pine">{jumlahItem}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TrenChart data={dataTren} />
          <TopProdukChart data={dataTopProduk} />
        </div>

        {perMetode.size > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            {Array.from(perMetode.entries()).map(([m, v]) => (
              <span key={m} className="rounded-full border border-line bg-paper px-3 py-1">
                {m}: <b className="tabular">{v.jumlah}</b> · <span className="tabular">{rp(v.total)}</span>
              </span>
            ))}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-line bg-paper shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/60">
                <th className="p-3">No</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Kasir</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Member</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {transaksi.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="p-3 tabular">#{String(t.id).padStart(5, "0")}</td>
                  <td className="p-3">
                    {t.createdAt.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                  </td>
                  <td className="p-3">{t.kasir.nama}</td>
                  <td className="p-3">{t.tipe === "DINE_IN" ? `Dine in${t.meja ? " #" + t.meja : ""}` : "Take away"}</td>
                  <td className="p-3">{t.member?.nama ?? "-"}</td>
                  <td className="p-3">{t.metode}</td>
                  <td className="p-3 tabular text-right">{rp(t.total)}</td>
                  <td className="p-3">
                    <Link href={`/kasir/struk/${t.id}`} className="text-pine underline">Invoice</Link>
                  </td>
                </tr>
              ))}
              {transaksi.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-ink/50">Tidak ada transaksi pada rentang ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
