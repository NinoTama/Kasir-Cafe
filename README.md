# Import menu lewat CSV (Excel)

## Pasang
Salin isi folder ini ke project. Tidak perlu migrasi database.

## Cara pakai
1. Buka /admin/produk/import (atau tambahkan link dari /admin/produk).
2. Buat file CSV: kolom kode, nama, kategori, harga, stok (lihat "Unduh contoh file CSV").
   Cara termudah: buat tabel di Excel/Google Sheets dengan kolom itu, lalu
   File > Download/Export > CSV.
3. Upload file itu (atau tempel isinya langsung di kotak teks).
4. Klik "Import sekarang".

Kode yang sudah ada akan DIPERBARUI (bukan dobel), kode baru akan dibuat sebagai
menu baru. Ini juga cocok dipakai untuk update harga massal nanti (tinggal
import ulang CSV dengan harga baru).

Catatan: fitur ini TIDAK mengimpor foto (foto tetap upload manual satu-satu
di /admin/produk, karena filenya tidak muat di format CSV).
