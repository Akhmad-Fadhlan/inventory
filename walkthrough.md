# Walkthrough — SISMA Frontend

Sistem Inventaris Manajemen Aset Sekolah (SISMA) frontend telah selesai diimplementasikan menggunakan Next.js 14 (App Router) dengan tema desain **Medical Soft** (calming teal, soft shadows, Nunito + Inter fonts, clinical clarity).

## 🚀 Fitur Utama
1. **Google OAuth & Keamanan**: Terintegrasi via NextAuth.js dengan perlindungan COOP agar login bebas error pop-up di browser.
2. **Scoping Multi-cabang & RBAC**:
   - `SUPER_ADMIN`: Akses penuh global.
   - `BRANCH_ADMIN`: Akses baca/tulis terbatas pada cabang milik mereka sendiri.
   - `TEACHER`: Akses baca aset dan peminjaman dalam cabang mereka.
3. **24 Endpoint Terkoneksi**: Semua data disalurkan secara aman melalui server-side API proxy `/api/proxy` untuk mencegah isu CORS di Google Apps Script (GAS).
4. **Alur Bisnis Otomatis**:
   - Pengembalian aset dengan status kerusakan otomatis membuat tiket perbaikan.
   - Inspeksi aset dengan temuan kerusakan otomatis membuat tiket perbaikan.
   - Menyelesaikan perbaikan otomatis mengembalikan status aset menjadi tersedia dan baik.
5. **Cetak & Ekspor Laporan**: Fitur cetak langsung yang ramah printer (`window.print()`) dengan CSS print media khusus.
6. **Babel Fallback Compiler**: Menambahkan konfigurasi `.babelrc` untuk mengatasi isu biner native SWC compiler pada Windows.

---

## 📂 Berkas yang Telah Dibuat & Dimodifikasi

Semua berkas berikut terletak di bawah direktori `sisma-frontend/`:

### 🔧 Konfigurasi & Fondasi
* [package.json](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/package.json) — Dependensi Next.js, NextAuth, Recharts, Lucide.
* [next.config.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/next.config.js) — Header keamanan COOP `same-origin-allow-popups`.
* [.env.local](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/.env.local) — Kredensial Google OAuth & URL Backend.
* [.babelrc](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/.babelrc) — Compiler fallback mengatasi error SWC di Windows.
* [src/app/globals.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/globals.css) — Variabel tema Medical Soft (Teal `#25b9ba` / `#38c7c8`) & animasi.

### 🧩 Komponen Bersama (`src/components/`)
* [Button.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Button.js) & [Button.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Button.module.css) — Tombol dengan variasi loading & icon.
* [Badge.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Badge.js) & [Badge.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Badge.module.css) — Label pill status/kondisi.
* [StatsCard.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/StatsCard.js) & [StatsCard.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/StatsCard.module.css) — Ringkasan metrik dashboard yang responsif.
* [DataTable.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/DataTable.js) & [DataTable.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/DataTable.module.css) — Tabel dengan pagination & skeleton loader.
* [Modal.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Modal.js) & [Modal.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Modal.module.css) — Dialog pop-up interaktif (Esc key & scroll-lock).
* [EmptyState.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/EmptyState.js) & [EmptyState.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/EmptyState.module.css) — Tampilan fallback jika data kosong.
* [ChartCard.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/ChartCard.js) & [ChartCard.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/ChartCard.module.css) — Container chart statistik.
* [Sidebar.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Sidebar.js) & [Sidebar.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Sidebar.module.css) — Menu navigasi sidebar responsif.
* [Topbar.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Topbar.js) & [Topbar.module.css](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/components/Topbar.module.css) — Header panel atas, dark/light mode toggle.

### 🌐 Halaman Dashboard & Alur Kerja (`src/app/(dashboard)/`)
* [layout.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/layout.js) — Tata letak dashboard, state responsif.
* [dashboard/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/dashboard/page.js) — Metrik, Recharts grafik status & kondisi, aktivitas terbaru.
* [assets/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/assets/page.js) — Daftar aset, pencarian debounced, filter kategori/status/kondisi, form tambah aset.
* [assets/[id]/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/assets/[id]/page.js) — Detail aset, unggah foto (Base64), regenerasi QR, riwayat transaksi aset, modal edit & hapus.
* [borrowings/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/borrowings/page.js) — Log peminjaman, form peminjaman baru, form pengembalian aset.
* [maintenance/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/maintenance/page.js) — Daftar perbaikan, pembukaan tiket baru, form resolusi/selesai perbaikan.
* [inspections/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/inspections/page.js) — Rekam audit fisik berkala (terintegrasi dengan auto-perbaikan).
* [transfers/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/transfers/page.js) — Perpindahan aset antar cabang/ruangan.
* [reports/page.js](file:///c:/Users/hp/Downloads/inventory/sisma-frontend/src/app/(dashboard)/reports/page.js) — Rekapitulasi cetak 4 tipe laporan.

---

## 🛠️ Langkah Menjalankan Secara Lokal

1. **Jalankan server Next.js**:
   Buka terminal di direktori `sisma-frontend/` dan jalankan:
   ```bash
   npm run dev
   ```
2. **Akses Aplikasi**:
   Buka browser dan buka `http://localhost:3000`. Login menggunakan akun Google Anda.

---

## 🐙 Langkah Push ke GitHub

Ikuti langkah-langkah ini dari terminal di dalam direktori `sisma-frontend/` untuk mengunggah proyek Anda ke GitHub:

1. **Inisialisasi repositori Git lokal**:
   ```bash
   git init
   ```
2. **Tambahkan file `.gitignore`** (untuk memastikan folder rahasia/besar seperti `node_modules` dan `.env.local` tidak terunggah):
   *Pastikan sudah ada `.gitignore` bawaan dari inisialisasi Next.js. Jika belum ada, buat file `.gitignore` di folder root `sisma-frontend/` dengan isi:*
   ```text
   node_modules/
   .next/
   out/
   build/
   .env*.local
   ```
3. **Tambahkan semua berkas ke staging**:
   ```bash
   git add .
   ```
4. **Lakukan commit pertama**:
   ```bash
   git commit -m "feat: implement complete Next.js 14 frontend for SISMA"
   ```
5. **Ubah nama branch utama menjadi `main`**:
   ```bash
   git branch -M main
   ```
6. **Hubungkan dengan repositori GitHub Anda**:
   *Ganti `<URL-REPOS-GITHUB-ANDA>` dengan URL HTTPS repositori GitHub yang baru Anda buat (contoh: `https://github.com/username/sisma-frontend.git`)*
   ```bash
   git remote add origin <URL-REPOS-GITHUB-ANDA>
   ```
7. **Unggah (Push) ke GitHub**:
   ```bash
   git push -u origin main
   ```
