# Pasang foto menu lewat dropdown (tanpa perlu ganti nama file)

PRASYARAT: project sudah pakai penyimpanan Vercel Blob (lib/uploads.ts versi
"unggahGambar"), dan ada endpoint GET /api/produk/daftar yang mengembalikan
daftar {id, nama, kode} semua produk (lihat file terpisah di paket ini).

## Pasang
Salin isi folder ini ke project. File baru, tidak menimpa apa pun KECUALI
kalau kamu sudah pernah pasang kasir-import-foto (yang versi cocok-nama-file) -
boleh ditimpa, versi ini lebih gampang dipakai.
Tidak perlu migrasi database.

## Cara pakai
1. Buka /admin/produk/import-foto
2. Klik kotak file, pilih SEMUA foto sekaligus (nama file bebas, apa saja).
3. Tiap foto muncul sebagai thumbnail kecil dengan dropdown di sampingnya.
4. Untuk tiap foto, klik dropdown-nya, cari dan pilih menu yang sesuai (bisa
   ketik untuk mencari lewat kode atau nama).
5. Setelah semua foto sudah dipilih menunya, klik tombol "Pasang X foto".
6. Semua foto langsung terpasang ke menu masing-masing dalam satu klik.
