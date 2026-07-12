import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { formatRupiah, formatDate, todayISO } from '../../utils';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { Capital } from '../../types';

export default function Capital() {
  const [jenis, setJenis] = useState<'tambah' | 'kurang'>('tambah');
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(todayISO());
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: capitals = [], isLoading } = useQuery<Capital[]>({
    queryKey: ['capitals'],
    queryFn: () => apiRequest<Capital[]>('/capital'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest('/capital/create', { body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capitals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setNominal(0);
      setKeterangan('');
      setTanggal(todayISO());
      showToast('Modal tersimpan', 'success');
    },
    onError: () => showToast('Gagal menyimpan modal', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) {
      showToast('Nominal harus > 0', 'error');
      return;
    }
    saveMutation.mutate({
      tanggal,
      jenis,
      nominal,
      keterangan,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Modal" subtitle="Catat modal tambah/kurang" />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-4 space-y-3 text-sm border border-gray-100"
      >
        <div>
          <label className="text-xs text-gray-500">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setJenis('tambah')}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              jenis === 'tambah' ? 'bg-green-500 text-white' : 'bg-gray-100'
            }`}
          >
            Tambah
          </button>
          <button
            type="button"
            onClick={() => setJenis('kurang')}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              jenis === 'kurang' ? 'bg-red-500 text-white' : 'bg-gray-100'
            }`}
          >
            Kurangi
          </button>
        </div>
        <input
          placeholder="Nominal"
          type="number"
          value={nominal || ''}
          onChange={(e) => setNominal(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <input
          placeholder="Keterangan"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold disabled:bg-gray-300"
        >
          {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {capitals.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">Belum ada catatan modal</p>
          ) : (
            capitals.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl p-4 border border-gray-100 text-sm"
              >
                <div className="flex justify-between">
                  <span
                    className={`font-medium ${
                      c.jenis === 'tambah' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {c.jenis === 'tambah' ? '+' : '-'} {formatRupiah(c.nominal)}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(c.tanggal)}</span>
                </div>
                <p className="text-xs text-gray-500">{c.keterangan}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}