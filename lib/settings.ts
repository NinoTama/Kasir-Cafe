import { prisma } from "./prisma";

export const SETTING_META = {
  diskon_persen: { label: "Diskon member (%)", default: 5, min: 0, max: 100 },
  kelipatan_poin: { label: "Belanja per 1 poin (Rp)", default: 10000, min: 1, max: 100000000 },
  nilai_poin: { label: "Nilai 1 poin saat ditukar (Rp)", default: 100, min: 1, max: 100000000 },
  min_poin_tukar: { label: "Minimal poin untuk ditukar", default: 100, min: 0, max: 100000000 },
} as const;

export type SettingKey = keyof typeof SETTING_META;
export type Settings = Record<SettingKey, number>;

export async function getSettings(): Promise<Settings> {
  const s = Object.fromEntries(
    Object.entries(SETTING_META).map(([k, m]) => [k, m.default])
  ) as Settings;
  const rows = await prisma.setting.findMany();
  for (const r of rows) if (r.key in s) s[r.key as SettingKey] = r.value;
  return s;
}
