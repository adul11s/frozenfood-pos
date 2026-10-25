import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { runOfflineSync } from '../utils/offlineSync';

const INVALIDATE_KEYS = [
  ['dashboard'],
  ['products'],
  ['report'],
];

export function useOfflineSync() {
  const { isOnline } = useStore();
  const qc = useQueryClient();
  const syncing = useRef(false);

  useEffect(() => {
    if (!isOnline || syncing.current) return;
    syncing.current = true;

    (async () => {
      try {
        const pending = await runOfflineSync();
        if (pending.synced + pending.failed > 0) {
          INVALIDATE_KEYS.forEach((queryKey) =>
            qc.invalidateQueries({ queryKey }),
          );
        }
      } finally {
        syncing.current = false;
      }
    })();
  }, [isOnline, qc]);

  return { isOnline };
}