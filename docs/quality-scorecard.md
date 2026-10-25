# Quality Scorecard

Rubrik sesuai plan-portfolio-9-5 section 1/6. Skor jujur per 2026-10-25; tiap klaim tautan ke buktinya.

| Dimensi | Bobot | Skor | Bukti |
|---|---|---|---|
| Narasi masalah | 10% | 8 | README#problem — POS kedai frozen food dengan mode offline nyata (antrean IndexedDB); belum ada case study naratif |
| Demo & reproduksibilitas | 15% | 7 | README install + `npm run dev` satu perintah, seed sheet manual via `gas/Code.gs`; tidak ada seed deterministik otomatis / video demo |
| Kebenaran & test | 20% | 8 | `vitest run` 20/20 (4 file test: harga grosir, role access, antrean offline, idempotensi GAS semua sheet) + CI hijau (run 40163305740). Frontend belum ada test E2E |
| Arsitektur & keputusan | 15% | 7 | README tabel arsitektur Google Sheets + Apps Script vs Postgres; idempotensi 5 sheet ditegakkan dengan test. Belum ada `docs/adr/` formal |
| Keamanan | 10% | 7 | Access control per role (`src/config/permissions.test.ts`), idempotensi mencegah double-charge; belum ada threat model / authz matrix tertulis |
| Operasional | 10% | 6 | Deploy Apps Script terdokumentasi; belum ada log korelasi, metrics, alert, runbook |
| Kerapian kode | 10% | 8 | Strict TS (`tsc -b`), oxlint bersih, tanpa dead code yang diketahui; dependency audit belum rutin |
| Presentasi | 10% | 6 | README above the fold dengan badge CI; GIF/video/case study belum ada |

**Total:** 7.2
**Target berikutnya:** docs/adr/ (keputusan Sheets vs Postgres ditolak), seed deterministik + video demo, threat model.
**Tanggal review:** 2026-10-25
