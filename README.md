# Perbaikan error build Vercel (spread Map iterator)

Vercel memakai target TypeScript yang lebih ketat daripada `npm run dev` di
lokal, sehingga `[...sebuahMap.entries()]` ditolak. Perbaikannya diganti jadi
`Array.from(sebuahMap.entries())` yang hasilnya sama persis tapi diterima di
kedua mode.

Salin isi folder ini ke project (timpa: app/admin/laporan/page.tsx,
app/api/transactions/route.ts). Tidak perlu migrasi database.
