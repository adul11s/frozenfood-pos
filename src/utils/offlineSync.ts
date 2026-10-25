import { getPendingSales, deletePendingSale } from './db';
import { createSale } from '../services/sales';
import type { SalePayload } from '../services/sales';

/**
 * Logika inti sinkronisasi antrean penjualan offline, dipisah dari
 * hook React agar bisa diuji dengan mock layer IndexedDB.
 * Retry-nya idempoten: GAS mengembalikan sukses (duplicate) bila
 * invoice sudah ada di sheet, jadi antrean aman diputar ulang.
 */
export const syncPendingSales = async (deps: {
  getPending: typeof getPendingSales;
  removePending: typeof deletePendingSale;
  createSaleFn: typeof createSale;
  onSynced?: (pendingCount: number) => void;
}): Promise<{ synced: number; failed: number }> => {
  const pending = (await deps.getPending()) as Array<
    SalePayload & { invoice: string }
  >;
  let synced = 0;
  let failed = 0;

  for (const sale of pending) {
    try {
      await deps.createSaleFn(sale);
      try {
        await deps.removePending(sale.invoice);
      } catch {
        // Hapus dari antrean gagal: baris tetap di antrean. Retry
        // berikutnya aman (duplicate diabaikan di GAS).
      }
      synced++;
    } catch {
      failed++;
      break; // network masih bermasalah - tunggu siklus berikutnya
    }
  }

  if (pending.length > 0) deps.onSynced?.(pending.length);
  return { synced, failed };
};

export const runOfflineSync = (): Promise<{ synced: number; failed: number }> =>
  syncPendingSales({
    getPending: getPendingSales,
    removePending: deletePendingSale,
    createSaleFn: createSale,
  });
