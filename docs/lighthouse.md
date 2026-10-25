# Lighthouse PWA Audit — frozenfood-pos

Angka di bawah berasal dari run nyata `@lhci/cli` (LHCI) terhadap production build lokal, bukan klaim estimasi. Semua angka dapat direproduksi dengan perintah di bagian [Reproduksi](#reproduksi).

| Audits | Skor (raw dari LHCI) |
|---|---|
| Performance | 0.95 |
| Accessibility | 0.87 |
| Best Practices | 0.96 |
| SEO | 0.82 |
| PWA category | TIDAK ADA — Lighthouse v12 menghapus kategori PWA |

## Ringkasan angka penting (raw audit)

| Audit | Nilai |
|---|---|
| first-contentful-paint | 0.73 — runtime lokal |
| largest-contentful-paint | 0.92 |
| speed-index | 0.98 |
| total-blocking-time | 0 → 1.0 |
| cumulative-layout-shift | 0 → 1.0 |
| viewport | mobile-friendly |


## Mengapa tidak ada "PWA score"

- Lighthouse versi 12 (yang dipakai LHCI terkini) sudah menghapus kategori PWA; tidak lagi ada skor PWA tunggal. Sisa audit PWA (`pwa-installable`, `service-worker`, `on-offline`) juga sudah dihapus.
- PWA di repo ini ditegakkan dari implementasi & test, bukan skor:
  - `vite-plugin-pwa` dengan precache 15 entri (service worker + workbox)
  - Antrean offline IndexedDB (`pendingSales`) + sinkron otomatis, termasuk mid-sync failure + recovery — bukti: `src/utils/offlineSync.test.ts` dan `gas/__tests__/code.idempotency.test.ts`
  - Manifest + icons PWA (`public/`)

## Reproduksi

```bash
npm install
npm ci            # produksi build deterministik
npm run build
npx vite preview --port 4173 --strictPort &
npx lhci collect --url=http://localhost:4173 \
  --chrome-launcher.flags="--headless --disable-gpu --chrome-path=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome" \
  --numberOfRuns=1
```

## Lingkungan run

| Item | Nilai |
|---|---|
| Lighthouse version | 12.6.1 |
| lhci version | @lhci/cli terkini (npm devDependency) |
| Target URL | http://localhost:4173 (`vite preview`, production build) |
| numberOfRuns | 1 |
| Chrome | headless, lingkungan mesin lokal, tanggal audit: 2026-10-25 |
| Laporan raw | [`docs/lighthouse/lhr.json`](/docs/lighthouse/lhr.json) (JSON full Lighthouse result) |
| Skor bisa di-regenerasi? | Ya, jalankan perintah reproduksi di atas |
