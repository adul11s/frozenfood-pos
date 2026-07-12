# Panduan Pengguna FrozenFood POS

Panduan lengkap untuk menggunakan aplikasi kasir Frozen Food POS.

---

## Daftar Isi

1. [Login](#1-login)
2. [Dashboard](#2-dashboard)
3. [Kasir (Sales)](#3-kasir-sales)
4. [Produk](#4-produk)
5. [Pembelian](#5-pembelian)
6. [Stock](#6-stock)
7. [Supplier](#7-supplier)
8. [Pengeluaran](#8-pengeluaran)
9. [Modal](#9-modal)
10. [Laporan](#10-laporan)
11. [Pengaturan](#11-pengaturan)
12. [Offline Mode](#12-offline-mode)
13. [Install PWA](#13-install-pwa)
14. [Manajemen User & Role](#14-manajemen-user--role)
15. [Cetak Nota Thermal](#15-cetak-nota-thermal)

---

## 1. Login

### Cara Login

1. Buka aplikasi FrozenFood POS di browser
2. Masukkan **Username** dan **Password**
3. Klik **"Masuk"**

### Default Users

| Username | Password | Role | Akses Menu |
|----------|----------|------|-----------|
| `owner` | `owner123` | Owner | Semua menu |
| `admin` | `admin123` | Admin | Semua kecuali Modal |
| `kasir` | `kasir123` | Kasir | Dashboard, Kasir, Produk, Stock, Pengaturan |

> **Penting:** Ganti password default di sheet `USERS` pada Google Sheets setelah setup pertama.

---

## 2. Dashboard

Dashboard menampilkan ringkasan bisnis secara real-time.

### Informasi yang ditampilkan

| Kartu | Deskripsi |
|-------|-----------|
| Modal | Total modal toko (tambah dikurangi kurang) |
| Nilai Stock | Total nilai stok (modal × qty semua produk) |
| Penjualan Hari Ini | Total omzet penjualan hari ini |
| Profit Hari Ini | Total keuntungan hari ini |

### Grafik Penjualan

- Menampilkan grafik batang penjualan **7 hari terakhir**
- Data di-refresh otomatis setiap 30 detik
- Angka di atas batang menampilkan total penjualan dalam ribuan (K)

### Akses Menu

Dashboard dapat diakses oleh semua role (owner, admin, kasir).

---

## 3. Kasir (Sales)

Halaman kasir adalah tempat melakukan transaksi penjualan.

### Cara Bertransaksi

#### Langkah 1: Cari Produk

1. Ketik nama produk di kolom **"Cari produk..."** di bagian atas
2. Produk akan terfilter otomatis sesuai yang diketik
3. Atau gunakan **filter kategori** di bawah kolom pencarian

#### Langkah 2: Pilih Kategori (Opsional)

- Klik tab kategori (misal "Frozen", "Seafood") untuk memfilter produk
- Klik "Semua" untuk menampilkan semua produk

#### Langkah 3: Tambah Produk ke Keranjang

1. Klik produk pada grid
2. Produk otomatis masuk ke keranjang dengan qty 1
3. Produk dengan stok 0 tidak bisa diklik (berlabel "HABIS")
4. Tambah qty dengan tombol **"+"**, kurangi dengan **"-"**
5. Hapus produk dengan tombol **"✕"**

#### Harga Grosir Otomatis

- Jika qty ≥ **Min Grosir** → harga otomatis berubah ke harga grosir
- Label **"GROSIR"** muncul di keranjang
- Contoh:
  - Min Grosir = 5, Ecer = Rp50.000, Grosir = Rp47.000
  - Beli 4 pcs → Rp50.000/pc (ecer)
  - Beli 5 pcs → Rp47.000/pc (grosir)

#### Langkah 4: Set Diskon (Opsional)

1. Masukkan nominal diskon pada field **"Diskon"**
2. Total otomatis terupdate: Subtotal - Diskon

#### Langkah 5: Pilih Metode Pembayaran

| Metode | Tombol |
|--------|--------|
| Tunai | 💵 Tunai |
| QRIS | 📱 QRIS |
| Transfer | 🏦 Transfer |

- Jika pilih **Tunai**, akan muncul field **"Uang diterima"**
- Masukkan uang dari pelanggan
- Sistem otomatis hitung **Kembalian**

#### Langkah 6: Bayar

1. Pastikan uang diterima ≥ total (untuk tunai)
2. Klik tombol **"BAYAR Rp..."**
3. Modal **"Pembayaran Berhasil"** muncul dengan detail nota

#### Langkah 7: Cetak Nota

1. Klik tombol **"PRINT"** pada modal nota
2. Browser akan membuka dialog print
3. Pilih printer thermal (58mm atau 80mm)
4. Klik **"Tutup"** untuk transaksi baru

#### Reset Keranjang

- Klik tombol **"RESET"** untuk mengosongkan keranjang dan diskon

---

## 4. Produk

Halaman untuk mengelola data produk (Create, Read, Update, Delete).

### Cara Menambah Produk Baru

1. Buka tab **"Produk"**
2. Isi form di bagian atas:

| Field | Keterangan | Contoh |
|-------|-----------|--------|
| Nama Produk | Nama produk | Nugget Fiesta |
| Kategori | Kategori produk | Frozen |
| Expired | Tanggal kadaluarsa | 2026-12-20 |
| Modal | Harga modal per satuan | 42000 |
| Ecer | Harga jual ecer | 50000 |
| Grosir | Harga jual grosir | 47000 |
| Min Grosir | Qty minimum untuk harga grosir | 5 |
| Stock | Jumlah stok awal | 100 |

3. Klik **"Tambah"**
4. Barcode dibuat otomatis oleh sistem (format: `P{timestamp}`)
5. Produk tersimpan ke Google Sheets

### Cara Edit Produk

1. Klik tombol **"Edit"** pada produk
2. Form akan terisi dengan data produk tersebut
3. Ubah field yang ingin diubah
4. Klik **"Update"**

### Cara Ubah Minimum Grosir

1. Edit produk (klik "Edit")
2. Ubah field **"Min Grosir"**
3. Klik **"Update"**
4. Harga grosir otomatis aktif saat qty mencapai minimum baru

### Cara Hapus Produk

1. Klik tombol **"Hapus"** pada produk
2. Konfirmasi dengan klik "OK"
3. Produk dihapus permanen dari Google Sheets

### Indikator Stok

| Warna Titik | Status Stok |
|-------------|-------------|
| Hijau (●) | Stok aman (> 5) |
| Kuning (●) | Stok menipis (1-5) |
| Merah (●) | Stok habis (0) |

---

## 5. Pembelian

Halaman untuk mencatat pembelian stok dari supplier.

### Cara Mencatat Pembelian

1. Buka tab **"Pembelian"**
2. Isi form:

| Field | Keterangan |
|-------|-----------|
| Tanggal | Tanggal pembelian (default: hari ini) |
| Supplier | Pilih supplier dari dropdown |
| Produk | Pilih produk dari dropdown |
| Jumlah | Qty yang dibeli |
| Modal/Satuan | Harga beli per unit |

3. Klik **"Simpan Pembelian"**
4. Data tersimpan ke sheet `PURCHASE`

> **Catatan:** Pembelian tidak otomatis menambah stok. Untuk menambah stok, gunakan halaman **Stock** dan lakukan **Stock In**.

### Menambah Supplier Baru

Jika supplier belum ada di dropdown:

1. Buka tab **"Supplier"**
2. Tambahkan supplier baru
3. Kembali ke halaman Pembelian, supplier akan muncul di dropdown

---

## 6. Stock

Halaman untuk menambah atau mengurangi stok produk.

### Cara Stock In (Tambah Stok)

1. Buka tab **"Stock"**
2. Klik tombol **"Stock In"** (hijau)
3. Pilih **Tanggal**
4. Pilih **Produk** dari dropdown
5. Masukkan **Jumlah** yang ditambahkan
6. Isi **Keterangan** (opsional, misal: "Beli dari Supplier A")
7. Klik **"Simpan"**
8. Stok produk bertambah otomatis

### Cara Stock Out (Kurangi Stok)

1. Klik tombol **"Stock Out"** (merah)
2. Pilih **Tanggal**
3. Pilih **Produk** dari dropdown
4. Masukkan **Jumlah** yang dikurangi
5. Isi **Keterangan** (opsional, misal: "Rusak", "Expired")
6. Klik **"Simpan"**
7. Stok produk berkurang otomatis

### Daftar Stok

Di bagian bawah halaman, terdapat daftar semua produk dengan stok saat ini:

| Warna | Status |
|-------|--------|
| Hijau | Stok > 20 |
| Kuning | Stok 6-20 |
| Merah | Stok ≤ 5 |

---

## 7. Supplier

Halaman untuk mengelola data supplier (CRUD).

### Cara Menambah Supplier

1. Buka tab **"Supplier"**
2. Isi form:

| Field | Keterangan |
|-------|-----------|
| Nama Supplier | Nama supplier |
| Telepon | Nomor telepon (opsional) |
| Alamat | Alamat supplier (opsional) |

3. Klik **"Tambah"**

### Cara Edit Supplier

1. Klik **"Edit"** pada supplier
2. Ubah data
3. Klik **"Update"**

### Cara Hapus Supplier

1. Klik **"Hapus"** pada supplier
2. Konfirmasi

---

## 8. Pengeluaran

Halaman untuk mencatat pengeluaran toko (listrik, sewa, gas, dll).

### Cara Mencatat Pengeluaran

1. Buka tab **"Pengeluaran"**
2. Isi form:

| Field | Keterangan | Contoh |
|-------|-----------|--------|
| Tanggal | Tanggal pengeluaran | Hari ini |
| Kategori | Jenis pengeluaran | Listrik, Sewa, Gas |
| Nominal | Jumlah uang | 150000 |
| Keterangan | Catatan tambahan | Bayar listrik bulan Juli |

3. Klik **"Catat Pengeluaran"**

### Daftar Pengeluaran

- Semua pengeluaran tampil di bawah form
- Diurutkan dari yang terlama
- Menampilkan nominal (merah), tanggal, kategori, dan keterangan

---

## 9. Modal

Halaman untuk mencatat modal toko (tambah/kurang).

### Cara Menambah Modal

1. Buka tab **"Modal"**
2. Klik tombol **"Tambah"** (hijau)
3. Pilih **Tanggal**
4. Masukkan **Nominal**
5. Isi **Keterangan** (opsional, misal: "Modal awal", "Tambah modal dari profit")
6. Klik **"Simpan"**

### Cara Mengurangi Modal

1. Klik tombol **"Kurangi"** (merah)
2. Pilih **Tanggal**
3. Masukkan **Nominal**
4. Isi **Keterangan** (opsional, misal: "Tarik modal untuk pribadi")
5. Klik **"Simpan"**

### Daftar Riwayat Modal

- Semua transaksi modal tampil di bawah form
- Hijau (+) untuk tambah modal
- Merah (-) untuk kurang modal

> **Akses:** Hanya role **Owner** yang bisa mengakses halaman Modal.

---

## 10. Laporan

Halaman untuk melihat ringkasan penjualan dan keuangan.

### Filter Laporan

| Filter | Rentang Waktu |
|--------|---------------|
| Hari Ini | Hari ini (00:00 - 23:59) |
| Minggu | Minggu ini (Senin - Minggu) |
| Bulan | Bulan ini |
| Custom | Pilih tanggal sendiri |

### Cara Pakai Custom Filter

1. Klik tombol **"Custom"**
2. Pilih **Dari** tanggal awal
3. Pilih **Sampai** tanggal akhir
4. Laporan akan terupdate otomatis

### Informasi yang ditampilkan

| Kartu | Deskripsi |
|-------|-----------|
| Omzet | Total penjualan pada periode |
| Profit | Total keuntungan pada periode |
| Terlaris | Produk dengan qty terjual terbanyak |
| Pengeluaran | Total pengeluaran pada periode |
| Total Modal | Total modal toko saat ini |
| Nilai Stock | Total nilai stok saat ini |

> **Akses:** Role **Owner** dan **Admin** bisa melihat Laporan. Kasir tidak bisa.

---

## 11. Pengaturan

Halaman untuk melihat info aplikasi dan logout.

### Informasi yang ditampilkan

| Item | Deskripsi |
|------|-----------|
| Status Koneksi | Online / Offline |
| User | Nama user yang sedang login |
| Role | Role user (Owner / Admin / Kasir) |
| Nama Toko | Nama toko (TOKO FROZEN FOOD) |
| Receipt | Ukuran thermal printer (58mm / 80mm) |
| PWA Version | Versi aplikasi |

### Logout

1. Klik tombol **"Logout"** di bagian bawah
2. Konfirmasi dengan klik "OK"
3. Kembali ke halaman login

### Transaksi Pending

- Saat offline, jumlah transaksi yang belum tersinkronisasi ditampilkan
- Setelah online, transaksi otomatis tersinkronisasi ke Google Sheets

---

## 12. Offline Mode

Aplikasi tetap bisa beroperasi tanpa internet.

### Cara Kerja

1. Saat **offline**, transaksi kasir disimpan di IndexedDB (penyimpanan lokal)
2. Banner kuning muncul: "Mode Offline — Transaksi disimpan, sinkronisasi saat online"
3. Saat **kembali online**, sistem otomatis:
   - Mengirim semua transaksi pending ke Google Sheets
   - Menghapus transaksi dari IndexedDB setelah berhasil
   - Me-refresh data dashboard, produk, dan grafik

### Yang Bisa Dilakukan Offline

- Melihat produk (dari cache)
- Melakukan transaksi kasir
- Mencetak nota
- Melihat dashboard (data terakhir yang ter-cache)

### Yang Tidak Bisa Offline

- Login (butuh koneksi ke Google Sheets)
- Menambah/edit/hapus produk
- Stock in/out
- Mencatat pembelian, pengeluaran, modal
- Melihat laporan real-time

### Cek Transaksi Pending

1. Buka tab **"Pengaturan"**
2. Jika offline dan ada transaksi pending, akan muncul info:
   > "X transaksi menunggu sinkronisasi"

---

## 13. Install PWA

Aplikasi bisa diinstall seperti aplikasi native di Android/iPhone/desktop.

### Install di Android (Chrome)

1. Buka URL aplikasi di Chrome
2. Klik menu **⋮** di kanan atas
3. Pilih **"Add to Home screen"**
4. Klik **"Add"**
5. Aplikasi muncul di home screen dengan icon

### Install di iPhone (Safari)

1. Buka URL aplikasi di Safari
2. Klik tombol **Share** (kotak dengan panah ke atas)
3. Pilih **"Add to Home Screen"**
4. Klik **"Add"**

### Install di Desktop (Chrome/Edge)

1. Buka URL aplikasi
2. Klik icon **Install** di address bar (atau menu ⋮ > Install)
3. Klik **"Install"**
4. Aplikasi terbuka di window terpisah

### Keuntungan Install PWA

- Buka seperti aplikasi native (tidak perlu browser)
- Full screen tanpa address bar
- Data tetap tersimpan
- Auto update saat versi baru dirilis
- Bisa offline

---

## 14. Manajemen User & Role

### Role dan Akses Menu

| Menu | Owner | Admin | Kasir |
|------|:-----:|:-----:|:-----:|
| Dashboard | ✅ | ✅ | ✅ |
| Kasir | ✅ | ✅ | ✅ |
| Produk | ✅ | ✅ | ✅ |
| Pembelian | ✅ | ✅ | ❌ |
| Stock | ✅ | ✅ | ✅ |
| Supplier | ✅ | ✅ | ❌ |
| Pengeluaran | ✅ | ✅ | ❌ |
| Modal | ✅ | ❌ | ❌ |
| Laporan | ✅ | ✅ | ❌ |
| Pengaturan | ✅ | ✅ | ✅ |

### Cara Menambah User Baru

1. Buka Google Sheets
2. Buka sheet **USERS**
3. Tambah baris baru:

| id | username | password | nama | role |
|----|----------|----------|------|------|
| 4 | kasir2 | kasir2pass | Kasir 2 | kasir |

4. Save — user langsung bisa login

### Cara Mengubah Role User

1. Buka sheet **USERS** di Google Sheets
2. Ubah kolom **role** (pilih: `owner`, `admin`, atau `kasir`)
3. Save

### Cara Mengubah Password

1. Buka sheet **USERS** di Google Sheets
2. Ubah kolom **password**
3. Save

---

## 15. Cetak Nota Thermal

### Ukuran yang Didukung

- **58mm** — printer thermal kecil (default)
- **80mm** — printer thermal besar

### Cara Mencetak

1. Setelah transaksi berhasil, modal nota muncul
2. Klik tombol **"PRINT"**
3. Browser dialog print terbuka
4. Pilih printer thermal
5. Klik Print

### Isi Nota

```
TOKO FROZEN FOOD
12/07/2026
--------------------------------
Nugget Fiesta        Rp100.000
  2 x Rp50.000
Sosis Sapi           Rp35.000
  1 x Rp35.000
--------------------------------
TOTAL                Rp135.000
Bayar                Rp150.000
Kembali              Rp15.000
--------------------------------
     Terima kasih
```

### Troubleshooting Print

| Masalah | Solusi |
|---------|--------|
| Print mencetak seluruh halaman | Pastikan browser mendukung @media print CSS |
| Font terlalu kecil/besar | Sesuaikan ukuran di dialog print browser |
| Nota tidak muncul | Pastikan transaksi berhasil (cek koneksi internet) |

---

## FAQ

### Q: Bagaimana cara mengubah nama toko di nota?
Buka file `src/components/receipt/ThermalPrinter.tsx`, ubah teks "TOKO FROZEN FOOD".

### Q: Bagaimana cara mengubah harga grosir minimum?
Edit produk di halaman Produk, ubah field "Min Grosir", klik Update.

### Q: Apakah data aman?
Data disimpan di Google Sheets milik Anda. Hanya yang punya akses ke spreadsheet yang bisa melihat data.

### Q: Bagaimana jika internet putus saat transaksi?
Transaksi disimpan offline di IndexedDB. Saat internet kembali, otomatis tersinkronisasi.

### Q: Bagaimana cara backup data?
Google Sheets otomatis menyimpan history. Bisa juga di-export via File > Download di Google Sheets.

### Q: Berapa banyak produk yang bisa disimpan?
Tidak ada batas keras. Google Sheets mendukung hingga 40.000 baris per sheet.

### Q: Bisakah multiple kasir login bersamaan?
Ya, setiap user login dengan akunnya sendiri. Nama kasir tercatat di setiap transaksi.

### Q: Bagaimana cara melihat detail penjualan?
Buka Google Sheets, lihat sheet `SALES` (ringkasan) dan `SALES_DETAIL` (rincian per item).