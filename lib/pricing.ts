import type { Settings } from "./settings";

export type HasilHitung = {
  subtotal: number;
  diskon: number;
  poinDipakai: number;
  potonganPoin: number;
  total: number;
  poinDidapat: number;
};

/** Fungsi murni: hitung diskon & poin. Dipanggil di SERVER saat checkout. */
export function hitungTotal(
  subtotal: number,
  member: { poin: number } | null,
  pakaiPoin: number,
  s: Settings
): HasilHitung {
  if (!member) {
    return { subtotal, diskon: 0, poinDipakai: 0, potonganPoin: 0, total: subtotal, poinDidapat: 0 };
  }

  const diskon = Math.floor((subtotal * s.diskon_persen) / 100);
  const setelahDiskon = subtotal - diskon;

  let poinDipakai = 0;
  if (pakaiPoin > 0 && pakaiPoin >= s.min_poin_tukar) {
    const maksPoinBisaDipakai = Math.floor(setelahDiskon / s.nilai_poin); // total tidak boleh minus
    poinDipakai = Math.min(pakaiPoin, member.poin, maksPoinBisaDipakai);
  }
  const potonganPoin = poinDipakai * s.nilai_poin;

  const total = setelahDiskon - potonganPoin;
  const poinDidapat = Math.floor(total / s.kelipatan_poin);

  return { subtotal, diskon, poinDipakai, potonganPoin, total, poinDidapat };
}
