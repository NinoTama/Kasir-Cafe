# Semua file siap pasang (Vercel Blob + fitur catatan)

## Pasang (1x salin semua)
1. Ekstrak zip ini.
2. Buka foldernya, Ctrl+A, Ctrl+C.
3. Buka folder "kasir" project kamu di File Explorer, Ctrl+V, pilih
   "Replace the files in the destination".
4. HAPUS folder app/api/gambar (yang isinya [name]/route.ts) - klik kanan di
   VS Code Explorer, Delete. Sudah tidak dipakai lagi.
5. Terminal: npm install @vercel/blob
6. npm run dev
7. Buka /admin/produk, upload ulang semua foto menu.
8. Cek /kasir, pastikan semua foto muncul.

Tidak perlu migrasi database untuk paket ini.
