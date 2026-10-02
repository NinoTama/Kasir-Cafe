import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rp } from "@/lib/format";
import { CAFE } from "@/lib/config";
import PrintButton from "@/components/PrintButton";

export default async function StrukPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await prisma.transaction.findUnique({
    where: { id: Number(params.id) || 0 },
    include: { items: { include: { product: true } }, member: true, kasir: true },
  });
  // kasir hanya boleh lihat struk transaksinya sendiri
  if (!t || (session.user.role !== "ADMIN" && t.kasirId !== Number(session.user.id))) notFound();

  const tgl = t.createdAt.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jakarta" });
  const baris = (label: string, nilai: string, tebal = false) => (
    <div className={`flex justify-between ${tebal ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{nilai}</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-cream p-4">
      <div className="mx-auto w-full max-w-[320px] space-y-1 rounded-2xl border border-line bg-white p-4 font-mono text-xs text-black shadow-sm print:w-[320px] print:rounded-none print:border-0 print:shadow-none">
        <div className="text-center">
          <div className="text-sm font-bold">{CAFE.nama}</div>
          <div>{CAFE.alamat}</div>
        </div>
        <hr className="border-dashed border-black" />
        {baris("No", "#" + String(t.id).padStart(5, "0"))}
        {baris("Tanggal", tgl)}
        {baris("Kasir", t.kasir.nama)}
        {baris("Tipe", t.tipe === "DINE_IN" ? `Dine in${t.meja ? " - Meja " + t.meja : ""}` : "Take away")}
        {t.member && baris("Member", t.member.nama)}
        <hr className="border-dashed border-black" />
        {t.items.map((i) => (
          <div key={i.id}>
            <div>{i.product.nama}</div>
            {i.catatan && <div className="pl-2 italic">- {i.catatan}</div>}
            {baris(`  ${i.qty} x ${rp(i.harga)}`, rp(i.qty * i.harga))}
          </div>
        ))}
        <hr className="border-dashed border-black" />
        {baris("Subtotal", rp(t.subtotal))}
        {t.diskon > 0 && baris("Diskon member", "-" + rp(t.diskon))}
        {t.potonganPoin > 0 && baris(`Tukar ${t.poinDipakai} poin`, "-" + rp(t.potonganPoin))}
        {baris("TOTAL", rp(t.total), true)}
        {baris(`Bayar (${t.metode})`, rp(t.bayar))}
        {baris("Kembali", rp(t.kembalian))}
        {t.member && (
          <>
            <hr className="border-dashed border-black" />
            {baris("Poin didapat", "+" + t.poinDidapat)}
            {baris("Saldo poin", String(t.member.poin))}
          </>
        )}
        <hr className="border-dashed border-black" />
        <div className="text-center">{CAFE.footer}</div>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[320px] gap-2 print:hidden">
        <PrintButton />
        <Link href="/kasir" className="flex-1 rounded-lg border border-line px-4 py-2 text-center text-sm text-ink/70 hover:border-pine">Transaksi baru</Link>
      </div>
    </main>
  );
}
