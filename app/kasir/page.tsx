import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import LogoutButton from "@/components/LogoutButton";
import KasirClient from "@/components/KasirClient";
import { CAFE } from "@/lib/config";

export default async function KasirPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [products, settings] = await Promise.all([
    prisma.product.findMany({ orderBy: { nama: "asc" } }),
    getSettings(),
  ]);

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 border-b border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div>
            <div className="font-display text-xl text-pine">{CAFE.nama}</div>
            <p className="text-sm text-ink/60">{session.user.name} · {session.user.role === "ADMIN" ? "Admin" : "Kasir"}</p>
          </div>
          <div className="flex items-center gap-3">
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-sm text-pine underline">Admin</Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl p-4">
        <KasirClient products={products} settings={settings} />
      </div>
    </main>
  );
}
