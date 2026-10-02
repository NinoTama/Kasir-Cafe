# Tahap: Tampilan ramah HP (halaman admin + struk)

Pelengkap dari paket kasir-mobile (yang sudah membenahi halaman /kasir).
Paket ini membenahi sisanya:

- Struk/invoice: lebar dibuat fleksibel (dulu tetap 320px, bisa overflow di
  HP yang layarnya persis 320px seperti iPhone SE). Saat dicetak/print tetap
  320px seperti semula.
- Dashboard admin, Menu & Stok, Laporan, Akun, Pengaturan: padding dan ukuran
  judul menyesuaikan di layar sempit, header tidak lagi mepet/berpotensi
  terpotong di HP kecil.
- Laporan: grafik berdampingan mulai dari ukuran tablet (md) alih-alih baru
  di laptop (lg), supaya tablet dalam posisi potret pun tetap rapi, dan
  ditambahi pengaman overflow-x-hidden.

## Pasang
Salin isi folder ini ke project, timpa:
- app/kasir/struk/[id]/page.tsx
- app/admin/page.tsx
- app/admin/produk/page.tsx
- app/admin/laporan/page.tsx
- app/admin/akun/page.tsx
- app/admin/pengaturan/page.tsx

Tidak perlu migrasi database.

git add .
git commit -m "tampilan ramah HP - halaman admin dan struk"
git push
