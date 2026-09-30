import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [jumlahProduk, stokMenipis] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stok: { lte: 5 } } }),
  ]);

  const menu = [
    { href: "/admin/produk", judul: "Menu & Stok", ket: `${jumlahProduk} menu · ${stokMenipis} stok menipis`, ikon: "☕" },
    { href: "/admin/laporan", judul: "Laporan Penjualan", ket: "Riwayat, invoice & grafik", ikon: "📊" },
    { href: "/admin/akun", judul: "Akun Kasir", ket: "Tambah & kelola akun", ikon: "👤" },
    { href: "/admin/pengaturan", judul: "Member", ket: "Diskon & aturan poin", ikon: "★" },
    { href: "/kasir", judul: "Kasir", ket: "Buka tampilan kasir", ikon: "🧾" },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-2xl text-pine">Dashboard Admin</div>
            <p className="text-sm text-ink/60">Halo, {session.user.name}</p>
          </div>
          <LogoutButton />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-2xl border border-line bg-paper p-5 shadow-sm transition hover:border-pine hover:shadow-md"
            >
              <div className="text-2xl">{m.ikon}</div>
              <div className="mt-2 font-medium text-ink">{m.judul}</div>
              <div className="text-sm text-ink/60">{m.ket}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
