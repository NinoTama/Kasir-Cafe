# Fix: tampilan HP kecil / harus zoom manual

Tambahkan export "viewport" di app/layout.tsx supaya browser HP merender
halaman sesuai lebar layar aslinya, bukan skala desktop yang diciutkan.

Salin isi folder ini ke project (timpa app/layout.tsx). Tidak perlu migrasi
database.
