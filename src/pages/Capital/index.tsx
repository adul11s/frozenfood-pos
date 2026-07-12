import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { formatRupiah, formatDate, todayISO } from '../../utils';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { Capital } from '../../types';

const inputCls = 'w-full panel-2 px-3 py-2 text-frost placeholder:text-frost-dim outline-none';

export default function Capital() {
  const [jenis, setJenis] = useState<'tambah' | 'kurang'>('tambah');
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(todayISO());
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: capitals = [], isLoading } = useQuery<Capital[]>({ queryKey: ['capitals'], queryFn: () => apiRequest<Capital[]>('/capital') });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiRequest('/capital/create', { body: payload }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['capitals'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setNominal(0); setKeterangan(''); setTanggal(todayISO()); showToast('Modal tersimpan', 'success'); },
    onError: () => showToast('Gagal menyimpan modal', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) { showToast('Nominal harus > 0', 'error'); return; }
    saveMutation.mutate({ tanggal, jenis, nominal, keterangan });
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Modal" subtitle="Catat modal tambah/kurang" />

      <form onSubmit={handleSubmit} className="panel p-4 space-y-3 text-sm">
        <div>
          <label className="text-xs text-frost-dim">Tanggal</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} required />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setJenis('tambah')} className={`flex-1 py-2 rounded-lg font-semibold ${jenis === 'tambah' ? 'bg-mint text-bg-deep' : 'panel-2 text-frost-dim'}`}>Tambah</button>
          <button type="button" onClick={() => setJenis('kurang')} className={`flex-1 py-2 rounded-lg font-semibold ${jenis === 'kurang' ? 'bg-alert text-white' : 'panel-2 text-frost-dim'}`}>Kurangi</button>
        </div>
        <input placeholder="Nominal" type="number" value={nominal || ''} onChange={(e) => setNominal(Number(e.target.value))} className={inputCls} required />
        <input placeholder="Keterangan" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className={inputCls} />
        <button type="submit" disabled={saveMutation.isPending} className="w-full bg-gradient-to-r from-ice to-ice-dim text-bg-deep py-2 rounded-lg font-semibold disabled:opacity-35">
          {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>

      {isLoading ? <Spinner /> : (
        <div className="space-y-2">
          {capitals.length === 0 ? <p className="text-center text-frost-dim py-6 text-sm">Belum ada catatan modal</p> : capitals.map((c) => (
            <div key={c.id} className="panel p-4 text-sm">
              <div className="flex justify-between">
                <span className={`font-medium font-mono ${c.jenis === 'tambah' ? 'text-mint' : 'text-alert'}`}>
                  {c.jenis === 'tambah' ? '+' : '-'} {formatRupiah(c.nominal)}
                </span>
                <span className="text-xs text-frost-dim">{formatDate(c.tanggal)}</span>
              </div>
              <p className="text-xs text-frost-dim mt-1">{c.keterangan}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}