import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings, SETTING_META, SettingKey } from "@/lib/settings";

async function simpan(fd: FormData) {
  "use server";
  await requireRole("ADMIN"); // cek role lagi di server action
  for (const [key, meta] of Object.entries(SETTING_META)) {
    const v = Number(fd.get(key));
    if (!Number.isInteger(v) || v < meta.min || v > meta.max) continue;
    await prisma.setting.upsert({ where: { key }, update: { value: v }, create: { key, value: v } });
  }
  revalidatePath("/admin/pengaturan");
}

export default async function PengaturanPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");
  const s = await getSettings();

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl text-pine">Pengaturan Member</div>
          <Link href="/admin" className="text-sm text-pine underline">← Dashboard</Link>
        </div>
        <form action={simpan} className="space-y-4 rounded-2xl border border-line bg-paper p-5 shadow-sm">
          {(Object.keys(SETTING_META) as SettingKey[]).map((key) => (
            <label key={key} className="block text-sm">
              <span className="text-ink/70">{SETTING_META[key].label}</span>
              <input
                name={key}
                type="number"
                defaultValue={s[key]}
                min={SETTING_META[key].min}
                max={SETTING_META[key].max}
                className="mt-1 w-full rounded-lg border border-line bg-white p-2 outline-none focus:border-pine"
              />
            </label>
          ))}
          <button className="rounded-lg bg-pine px-4 py-2 text-sm font-medium text-cream hover:bg-pine-dark">Simpan</button>
        </form>
      </div>
    </main>
  );
}
