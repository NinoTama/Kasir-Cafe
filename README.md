# Tahap: Pilihan peran (Admin/Kasir) di halaman login

Salin isi folder ini ke project (timpa app/login/page.tsx). Tidak perlu
migrasi database, tidak perlu env baru.

Cara kerja: user pilih tab "Admin" atau "Kasir" dulu, baru isi username &
password. Kalau akun yang login ternyata role-nya beda dari tab yang dipilih
(misal pilih tab Admin tapi akunnya Kasir), akan muncul pesan error dan
otomatis logout lagi (supaya tidak nyangkut di sesi yang salah).
