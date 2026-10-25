import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncPendingSales } from './offlineSync';
import type { SalePayload } from '../services/sales';

const sale = (invoice: string): SalePayload & { invoice: string } => ({
  invoice,
  tanggal: '2026-10-25',
  kasir: 'admin',
  subtotal: 10000,
  diskon: 0,
  total: 10000,
  bayar: 10000,
  kembali: 0,
  metode: 'cash',
  details: [],
});

const okDeps = (queue: Array<{ invoice: string }>) => ({
  getPending: vi.fn(async () => queue),
  removePending: vi.fn(async () => undefined),
  createSaleFn: vi.fn(async () => ({ success: true, invoice: 'x', profit: 0 })),
});

describe('syncPendingSales (antrean offline, layer IndexedDB dimock)', () => {
  it('sinkron semua antrean lalu hapus dari IndexedDB, onSynced dipanggil', async () => {
    const queue = [sale('INV1'), sale('INV2')];
    const deps = okDeps(queue);
    const onSynced = vi.fn();

    const res = await syncPendingSales({ ...deps, onSynced });

    expect(res.synced).toBe(2);
    expect(res.failed).toBe(0);
    expect(deps.createSaleFn).toHaveBeenCalledTimes(2);
    expect(deps.removePending).toHaveBeenCalledWith('INV1');
    expect(deps.removePending).toHaveBeenCalledWith('INV2');
    expect(onSynced).toHaveBeenCalledWith(2);
  });

  it('berhenti dengan failed>0 saat createSale gagal, baris tetap di antrean', async () => {
    const queue = [sale('INV1'), sale('INV2')];
    const deps = {
      getPending: vi.fn(async () => queue),
      removePending: vi.fn(async () => undefined),
      createSaleFn: vi
        .fn<() => Promise<{ success: boolean; invoice: string; profit: number }>>()
        .mockRejectedValueOnce(new Error('offline')),
    };

    const res = await syncPendingSales(deps);

    expect(res.synced).toBe(0);
    expect(res.failed).toBe(1);
    expect(deps.createSaleFn).toHaveBeenCalledTimes(1); // berhenti setelah gagal
    expect(deps.removePending).not.toHaveBeenCalled();
  });

  it('removePending gagal tidak dihitung gagal - retry berikutnya idempoten via invoice', async () => {
    const deps = {
      getPending: vi.fn(async () => [sale('INV1')]),
      removePending: vi.fn(async () => {
        throw new Error('db error');
      }),
      createSaleFn: vi.fn(async () => ({ success: true, invoice: 'x', profit: 0 })),
    };

    const res = await syncPendingSales(deps);
    expect(res.synced).toBe(1);
    expect(res.failed).toBe(0);
  });

  it('antrean kosong: tidak memanggil apa pun dan tidak trigger invalidate', async () => {
    const deps = okDeps([]);
    const onSynced = vi.fn();

    const res = await syncPendingSales({ ...deps, onSynced });

    expect(res.synced).toBe(0);
    expect(deps.createSaleFn).not.toHaveBeenCalled();
    expect(onSynced).not.toHaveBeenCalled();
  });
});

beforeEach(() => vi.clearAllMocks());
