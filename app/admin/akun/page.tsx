import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function gagal(msg: string): never {
  redirect("/admin/akun?err=" + encodeURIComponent(msg));
}

async function tambah(fd: FormData) {
  "use server";
  await requireRole("ADMIN");
  const nama = String(fd.get("nama") ?? "").trim();
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = fd.get("role") === "ADMIN" ? "ADMIN" : "KASIR";

  if (!nama || !/^[a-z0-9_.]{3,20}$/.test(username)) {
    gagal("Nama wajib diisi, username 3-20 karakter (huruf kecil, angka, titik, underscore)");
  }
  if (password.length < 6) gagal("Password minimal 6 karakter");
  if (await prisma.user.findUnique({ where: { username } })) gagal("Username sudah dipakai");

  await prisma.user.create({ data: { nama, username, role, password: await bcrypt.hash(password, 10) } });
  revalidatePath("/admin/akun");
}

async function ubah(fd: FormData) {
  "use server";
  const session = await requireRole("ADMIN");
  const id = Number(fd.get("id"));
  const nama = String(fd.get("nama") ?? "").trim();
  const role = fd.get("role") === "ADMIN" ? "ADMIN" : "KASIR";
  const passwordBaru = String(fd.get("password") ?? "");

  if (!nama) gagal("Nama wajib diisi");
  if (id === Number(session.user.id) && role !== "ADMIN") gagal("Tidak bisa menurunkan role akun sendiri");

  const data: { nama: string; role: "ADMIN" | "KASIR"; password?: string } = { nama, role };
  if (passwordBaru) {
    if (passwordBaru.length < 6) gagal("Password baru minimal 6 karakter");
    data.password = await bcrypt.hash(passwordBaru, 10);
  }
  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/akun");
}

async function toggleAktif(fd: FormData) {
  "use server";
  const session = await requireRole("ADMIN");
  const id = Number(fd.get("id"));
  if (id === Number(session.user.id)) gagal("Tidak bisa menonaktifkan akun sendiri");
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) gagal("Akun tidak ditemukan");
  await prisma.user.update({ where: { id }, data: { aktif: !u.aktif } });
  revalidatePath("/admin/akun");
}

const input = "w-full rounded-lg border border-line bg-white p-2 text-sm outline-none focus:border-pine";

export default async function AkunPage({ searchParams }: { searchParams: { err?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({ orderBy: [{ aktif: "desc" }, { nama: "asc" }] });

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-display text-xl text-pine sm:text-2xl">Akun Kasir & Admin</div>
          <Link href="/admin" className="text-sm text-pine underline">← Dashboard</Link>
        </div>

        {searchParams.err && (
          <p className="rounded-lg border border-brick/30 bg-brick/10 p-2.5 text-sm text-brick-dark">{searchParams.err}</p>
        )}

        <form action={tambah} className="grid gap-2 rounded-2xl border border-line bg-paper p-4 shadow-sm sm:grid-cols-5">
          <input name="nama" placeholder="Nama lengkap" className={`${input} sm:col-span-2`} required />
          <input name="username" placeholder="username" className={input} required />
          <input name="password" type="password" placeholder="Password (min 6)" className={input} required />
          <select name="role" className={input} defaultValue="KASIR">
            <option value="KASIR">Kasir</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="rounded-lg bg-pine p-2 text-sm font-medium text-cream transition hover:bg-pine-dark sm:col-span-5">
            + Tambah akun
          </button>
        </form>

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className={`rounded-2xl border p-3 shadow-sm ${u.aktif ? "border-line bg-paper" : "border-line bg-ink/5 opacity-60"}`}>
              <form action={ubah} className="grid gap-2 sm:grid-cols-6">
                <input type="hidden" name="id" value={u.id} />
                <input name="nama" defaultValue={u.nama} className={`${input} sm:col-span-2`} />
                <input value={u.username} disabled className={`${input} bg-cream text-ink/50`} />
                <input name="password" type="password" placeholder="Ganti password (opsional)" className={input} />
                <select name="role" defaultValue={u.role} className={input}>
                  <option value="KASIR">Kasir</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-pine px-2 text-sm text-cream transition hover:bg-pine-dark">Simpan</button>
                </div>
              </form>
              <form action={toggleAktif} className="mt-2 flex items-center justify-between text-sm">
                <input type="hidden" name="id" value={u.id} />
                <span className={u.aktif ? "text-pine" : "text-brick-dark"}>{u.aktif ? "● Aktif" : "○ Nonaktif"}</span>
                <button className="rounded-lg border border-line px-2 py-1 text-xs text-ink/70 hover:border-brick">
                  {u.aktif ? "Nonaktifkan" : "Aktifkan lagi"}
                </button>
              </form>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/50">
          Akun yang dinonaktifkan tidak bisa login lagi, tapi riwayat transaksinya tetap tersimpan.
          Akun tidak bisa dihapus supaya laporan lama tidak rusak.
        </p>
      </div>
    </main>
  );
}
