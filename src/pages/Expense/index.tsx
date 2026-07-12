import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { formatRupiah, formatDate, todayISO } from '../../utils';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { Expense } from '../../types';

export default function Expense() {
  const [kategori, setKategori] = useState('');
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(todayISO());
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => apiRequest<Expense[]>('/expense'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest('/expense/create', { body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setKategori('');
      setNominal(0);
      setKeterangan('');
      setTanggal(todayISO());
      showToast('Pengeluaran tercatat', 'success');
    },
    onError: () => showToast('Gagal mencatat pengeluaran', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori || nominal <= 0) {
      showToast('Lengkapi data', 'error');
      return;
    }
    saveMutation.mutate({
      tanggal,
      kategori,
      nominal,
      keterangan,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Pengeluaran" subtitle="Catat pengeluaran toko" />

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
        <input
          placeholder="Kategori"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
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
          className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold disabled:bg-gray-300"
        >
          {saveMutation.isPending ? 'Menyimpan...' : 'Catat Pengeluaran'}
        </button>
      </form>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">Belum ada pengeluaran</p>
          ) : (
            expenses.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-xl p-4 border border-gray-100 text-sm"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-red-500">{formatRupiah(e.nominal)}</span>
                  <span className="text-xs text-gray-400">{formatDate(e.tanggal)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {e.kategori} - {e.keterangan}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}