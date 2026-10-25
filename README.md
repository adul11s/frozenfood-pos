# Bios Frozen Food

PWA (Progressive Web App) kasir untuk toko Bios Frozen Food. Dibangun dengan React + TypeScript + Vite, menggunakan Google Sheets sebagai database dan Google Apps Script sebagai API. Bekerja offline dan tersinkronisasi otomatis saat online.

> **Status: DEMO.** Ini adalah aplikasi demo/portfolio, bukan produksi.
> Model auth-nya demo: login membuat token sesi (disimpan di sheet `SESSIONS`, berlaku 24 jam) dan setiap request membawa shared secret (`VITE_GAS_SECRET`, dibandingkan dengan Script Properties `SHARED_SECRET` di GAS). Secret tetap berada di sisi klien dan password user tersimpan plain di sheet — cukup untuk menghentikan akses tanpa kredensial, tidak lebih. Jangan pakai data nyata.

## Fitur

- **Login** — autentikasi via Google Sheets
- **Dashboard** — ringkasan modal, nilai stock, penjualan & profit hari ini, grafik 7 hari
- **Kasir (Sales)** — scan barcode, keranjang, harga grosir otomatis, multiple payment method, cetak nota thermal 58mm/80mm
- **Produk** — CRUD produk dengan barcode, kategori, harga ecer/grosir, stock, expired
- **Pembelian** — catat pembelian dari supplier dengan tanggal
- **Stock** — stock in / stock out dengan tanggal dan keterangan
- **Supplier** — CRUD data supplier
- **Pengeluaran** — catat pengeluaran toko
- **Modal** — catat modal tambah/kurang
- **Laporan** — filter hari ini / minggu / bulan / custom date range
- **Pengaturan** — status koneksi, info toko, logout, jumlah transaksi pending
- **Offline Mode** — transaksi disimpan di IndexedDB, sinkronisasi otomatis saat online
- **PWA** — installable ke home screen, auto update

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Server State | TanStack React Query v5 |
| Client State | Zustand v5 (persist) |
| Offline | IndexedDB |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Google Apps Script |
| Database | Google Sheets |

## Struktur Project

```
frozenfood-pos/
├── gas/
│   └── Code.gs              # Google Apps Script backend
├── public/
│   └── icons/               # PWA icons (192px, 512px)
├── src/
│   ├── components/
│   │   ├── ui/              # Card, Spinner, Toast
│   │   ├── charts/          # SalesChart
│   │   ├── receipt/         # ThermalPrinter
│   │   └── Navbar.tsx
│   ├── hooks/
│   │   ├── useOfflineSync.ts
│   │   └── useToast.tsx
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Product/
│   │   ├── Stock/
│   │   ├── Purchase/
│   │   ├── Sales/
│   │   ├── Report/
│   │   ├── Expense/
│   │   ├── Capital/
│   │   ├── Supplier/
│   │   └── Setting/
│   ├── services/
│   │   ├── api.ts           # Fetch wrapper ke GAS
│   │   ├── product.ts
│   │   ├── sales.ts
│   │   ├── stock.ts
│   │   ├── report.ts
│   │   └── supplier.ts
│   ├── store/
│   │   └── useStore.ts      # Zustand (cart, user, isOnline)
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── index.ts         # formatRupiah, generateInvoice, getHarga, etc
│   │   └── db.ts            # IndexedDB wrapper
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Setup & Deploy

### 1. Google Sheets Backend

1. Buka [sheets.new](https://sheets.new), buat spreadsheet baru
2. Beri nama **"Bios Frozen Food"**
3. Klik **Extensions > Apps Script**
4. Hapus kodedefault, paste seluruh isi `gas/Code.gs`
5. Jalankan fungsi `setup()` (klik Run) — ini akan membuat 12 sheet:
   - `USERS`, `PRODUCTS`, `STOCK`, `PURCHASE`, `SALES`, `SALES_DETAIL`, `EXPENSE`, `CAPITAL`, `SUPPLIER`, `CUSTOMER`, `LOG`, `SESSIONS`
6. Buka **Execution log** hasil run `setup()` — copy nilai `SHARED_SECRET` yang tercetak (sudah tersimpan otomatis di Script Properties)
7. Klik **Deploy > New deployment**
8. Klik gear icon > **Web app**
9. Set:
   - Description: `Bios Frozen Food API`
   - Execute as: **Me**
   - Who has access: **Anyone**
10. Klik **Deploy** > authorize permissions
11. Copy URL deployment (format: `https://script.google.com/macros/s/AKfyc.../exec`)

### 2. Frontend Setup

```bash
# Clone repo
git clone <repo-url>
cd frozenfood-pos

# Install dependencies
npm install

# Buat file .env
cp .env.example .env

# Edit .env, isi VITE_GAS_URL (URL deployment GAS)
# dan VITE_GAS_SECRET (SHARED_SECRET dari Script Properties)
echo 'VITE_GAS_URL=https://script.google.com/macros/s/AKfyc.../exec' > .env
echo 'VITE_GAS_SECRET=<shared-secret-dari-execution-log-setup>' >> .env

# Jalankan development server
npm run dev
```

Buka `http://localhost:5173`, login dengan:
- Username: `admin`
- Password: `admin123`

### 3. Deploy Frontend

#### Option A: Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Atau via [vercel.com](https://vercel.com):
- Import repository
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_GAS_URL` dan `VITE_GAS_SECRET` = URL deployment GAS + shared secret

Deploy production:
```bash
vercel --prod
```

#### Option B: Netlify

```bash
npm i -g netlify-cli
netlify deploy
```

- Build Command: `npm run build`
- Publish Directory: `dist`
- Environment Variables: `VITE_GAS_URL`

Deploy production:
```bash
netlify deploy --prod
```

#### Option C: Firebase Hosting

```bash
npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 4. PWA Icons (Optional)

Replace placeholder icons di `public/icons/` dengan icon asli:
- `icon-192.png` — 192x192px
- `icon-512.png` — 512x512px

## Google Sheets Structure

Satu spreadsheet berisi 11 sheet:

### USERS
| id | username | password | nama | role |

### PRODUCTS
| id | barcode | nama | kategori | modal | ecer | grosir | min_grosir | stock | expired |

### STOCK
| id | tanggal | barcode | jenis | qty | keterangan |

### PURCHASE
| no | supplier | tanggal | barcode | qty | modal |

### SALES
| invoice | tanggal | kasir | subtotal | diskon | total | bayar | kembali | metode |

### SALES_DETAIL
| invoice | barcode | produk | qty | harga | modal | profit |

### EXPENSE
| id | tanggal | kategori | nominal | keterangan |

### CAPITAL
| id | tanggal | jenis | nominal | keterangan |

### SUPPLIER
| id | nama | telepon | alamat |

### CUSTOMER
| id | nama | telepon | poin |

### LOG
| timestamp | aksi | detail |

### SESSIONS
| token | username | created | expires |

Token sesi dari login, berlaku 24 jam. Token kedaluwarsa dihapus otomatis saat cek auth.

## API Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/login` | POST | Login user |
| `/products` | GET | Ambil semua produk |
| `/products/create` | POST | Tambah produk |
| `/products/update` | PUT | Update produk |
| `/products/delete` | DELETE | Hapus produk |
| `/stock/in` | POST | Stock masuk |
| `/stock/out` | POST | Stock keluar |
| `/purchase` | POST | Catat pembelian |
| `/purchases` | GET | Ambil semua pembelian |
| `/sales` | POST | Catat penjualan + detail + kurangi stock + hitung profit |
| `/expense` | GET | Ambil semua pengeluaran |
| `/expense/create` | POST | Catat pengeluaran |
| `/capital` | GET | Ambil semua modal |
| `/capital/create` | POST | Catat modal |
| `/suppliers` | GET | Ambil semua supplier |
| `/supplier/create` | POST | Tambah supplier |
| `/supplier/update` | PUT | Update supplier |
| `/supplier/delete` | DELETE | Hapus supplier |
| `/summary` | GET | Dashboard summary (modal, stock value, today sales, today profit) |
| `/report` | POST | Laporan (filter: today/week/month/custom) |
| `/chart` | POST | Data grafik penjualan N hari |

## Harga Otomatis

```
Jika qty >= min_grosir → harga = grosir
Jika qty < min_grosir  → harga = ecer
```

## Offline Mode

1. Saat offline, transaksi kasir disimpan di IndexedDB (`pendingSales`)
2. Saat kembali online, hook `useOfflineSync` otomatis:
   - Mengambil semua pending sales dari IndexedDB
   - Mengirim ke Google Sheets via API
   - Menghapus dari IndexedDB jika berhasil
   - Me-refresh query (dashboard, products, chart)
3. Halaman Setting menampilkan jumlah transaksi yang pending

### Idempotensi (server-side, GAS backend)

Semua sheet mutation di sisi GAS dilindungi dengan dedupe key sebelum `appendRow`, sehingga retry sinkronisasi offline tidak pernah menggandakan data:

| Sheet | Kunci idempotensi | Kode | Test |
|---|---|---|---|
| SALES | `invoice` | `gas/Code.gs` (`createSale`) | `src/utils/offlineSync.test.ts` |
| PURCHASE | `body.no` | `gas/Code.gs` (`createPurchase`) | `gas/__tests__/code.idempotency.test.ts` |
| STOCK (in/out) | `body.id` / `body.key` | `gas/Code.gs` (`stockIn`/`stockOut`) | `gas/__tests__/code.idempotency.test.ts` |
| EXPENSE | `body.id` | `gas/Code.gs` (`createExpense`) | `gas/__tests__/code.idempotency.test.ts` |
| CAPITAL | `body.id` | `gas/Code.gs` (`createCapital`) | `gas/__tests__/code.idempotency.test.ts` |

Skenario offline→online dengan kegagalan di tengah sync (mutation gagal ½ jalan, lalu pemulihan → setiap mutation diterapkan tepat satu kali) tercakup di `gas/__tests__/code.idempotency.test.ts`.

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build (tsc + vite build)
npm run lint      # Lint dengan oxlint
npm run test      # Unit test dengan vitest (20 test: harga grosir, role access, antrean offline, idempotensi GAS)
npm run preview   # Preview production build
```

Status quality gates: `tsc -b` ✅ · `oxlint` ✅ · `vitest run` ✅ 20/20 (4 file test).

## Audit

- **Lighthouse**: skor performa, aksesibilitas, best-practices, SEO, dan catatan tentang kategori PWA (dihapus di Lighthouse v12) ada di [`docs/lighthouse.md`](/docs/lighthouse.md) dengan report JSON mentah dan perintah reproduksinya.

## Known Gaps

- **E2E ke GAS live belum dijalankan** — pipeline E2E terhadap deployment Apps Script nyata butuh deploy baru; saat ini backend hanya diuji via unit test sandbox (mock Sheets service).
- **Tidak ada skenario offline→online dengan screenshot** — perilaku hanya dibuktikan via unit test (mock), belum direkam visual.
- **Model auth demo** — shared secret masih di sisi klien dan password tersimpan plain di sheet (lihat catatan di atas).
- **Lighthouse skor bergantung mesin** — angka diambil dari satu run di laptop lokal; di CI dapat berbeda. Report JSON mentah dilampirkan sebagai bukti.

## Roadmap

### Versi 1 (MVP) — Selesai
- [x] Login
- [x] Dashboard + grafik
- [x] Master Produk (CRUD)
- [x] Supplier (CRUD)
- [x] Pembelian Stock
- [x] Kasir + Cetak Nota
- [x] Laporan (harian, mingguan, bulanan, custom)
- [x] Modal
- [x] Pengeluaran
- [x] Google Sheets sebagai database
- [x] Offline mode + sinkronisasi

### Versi 2 (Rencana)
- [ ] Barcode Scanner (kamera)
- [ ] Manajemen Pelanggan
- [ ] Retur Penjualan
- [ ] Retur Pembelian
- [ ] Import/Export Excel
- [ ] Backup & Restore
- [ ] Multi-user (Owner, Admin, Kasir)

### Versi 3 (Rencana)
- [ ] Multi Cabang
- [ ] Sinkronisasi real-time
- [ ] WhatsApp Struk Digital
- [ ] Integrasi QRIS
- [ ] Dashboard Analitik lengkap
- [ ] Prediksi stok dan penjualan

## License

MIT