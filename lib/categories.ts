// Daftar kategori bawaan (bisa dipakai atau diabaikan). Kategori sebenarnya
// diambil otomatis dari produk yang sudah diinput admin.
export const KATEGORI_SARAN = [
  "Kopi",
  "Non Kopi",
  "Teh",
  "Mocktail",
  "Pasta",
  "Pizza",
  "Main Course",
  "Panini",
  "Snack",
  "Dessert",
  "Pastry",
];

// Emoji penanda tiap kategori di halaman kasir. Kategori di luar daftar ini
// akan memakai ikon default.
export const IKON_KATEGORI: Record<string, string> = {
  Kopi: "☕",
  "Non Kopi": "🍵",
  Teh: "🍃",
  Mocktail: "🍹",
  Pasta: "🍝",
  Pizza: "🍕",
  "Main Course": "🍽️",
  Panini: "🥪",
  Snack: "🍟",
  Dessert: "🍰",
  Pastry: "🥐",
};

export const ikonKategori = (k: string | null) => IKON_KATEGORI[k ?? ""] ?? "🍴";
