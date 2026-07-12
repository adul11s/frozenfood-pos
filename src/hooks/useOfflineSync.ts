import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { getPendingSales, deletePendingSale } from '../utils/db';
import { createSale } from '../services/sales';

export function useOfflineSync() {
  const { isOnline } = useStore();
  const qc = useQueryClient();
  const syncing = useRef(false);

  useEffect(() => {
    if (!isOnline || syncing.current) return;
    syncing.current = true;

    (async () => {
      try {
        const pending = (await getPendingSales()) as { invoice: string }[];
        for (const sale of pending) {
          try {
            await createSale(sale as never);
            await deletePendingSale(sale.invoice);
          } catch {
            break;
          }
        }
        if (pending.length > 0) {
          qc.invalidateQueries({ queryKey: ['dashboard'] });
          qc.invalidateQueries({ queryKey: ['products'] });
          qc.invalidateQueries({ queryKey: ['report'] });
        }
      } finally {
        syncing.current = false;
      }
    })();
  }, [isOnline, qc]);

  return { isOnline };
}