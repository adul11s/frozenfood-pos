# Quality Scorecard

Rubrik sesuai plan-portfolio-9-5 section 1/6. Skor jujur per 2026-10-25; tiap klaim tautan ke buktinya.

| Dimensi | Bobot | Skor | Bukti |
|---|---|---|---|
| Narasi masalah | 10% | 8 | README#problem — POS kedai frozen food dengan mode offline nyata (antrean IndexedDB); belum ada case study naratif |
| Demo & reproduksibilitas | 15% | 9 | **Live: https://frozenfood-pos.vercel.app** (HTTP 200, terverifikasi 2026-10-25), installable PWA. README install + `npm run dev` satu perintah; seed sheet manual via `gas/Code.gs`. Tidak 10 karena tidak ada seed deterministik otomatis untuk reviewer dan belum ada video demo |
| Kebenaran & test | 20% | 8 | `vitest run` 20/20 (4 file test: harga grosir, role access, antrean offline, idempotensi GAS semua sheet) + CI hijau (run 40163305740). Frontend belum ada test E2E |
| Arsitektur & keputusan | 15% | 7 | README tabel arsitektur Google Sheets + Apps Script vs Postgres; idempotensi 5 sheet ditegakkan dengan test. Belum ada `docs/adr/` formal |
| Keamanan | 10% | 7 | Access control per role (`src/config/permissions.test.ts`), idempotensi mencegah double-charge; belum ada threat model / authz matrix tertulis |
| Operasional | 10% | 6 | Deploy Apps Script terdokumentasi; belum ada log korelasi, metrics, alert, runbook |
| Kerapian kode | 10% | 8 | Strict TS (`tsc -b`), oxlint bersih, tanpa dead code yang diketahui; dependency audit belum rutin |
| Presentasi | 10% | 6 | README above the fold dengan badge CI; GIF/video/case study belum ada |

**Total:** 7.5
**Delta 2026-10-25:** demo 7 → 9 setelah live URL (https://frozenfood-pos.vercel.app) terverifikasi HTTP 200 dan ditulis di README above the fold; total 7.2 → 7.5.
**Target berikutnya:** docs/adr/ (keputusan Sheets vs Postgres ditolak), seed deterministik + video demo, threat model.
**Tanggal review:** 2026-10-25
