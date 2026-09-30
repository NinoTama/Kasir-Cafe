# Perbaikan error build: tipe formatter chart (recharts)

TypeScript di Vercel lebih ketat soal tipe data formatter Tooltip recharts.
Diperbaiki dengan memberi tipe eksplisit "number" pada parameter formatter,
sesuai yang recharts harapkan.

Salin isi folder ini ke project (timpa: components/admin/TrenChart.tsx,
components/admin/TopProdukChart.tsx). Tidak perlu migrasi database.
