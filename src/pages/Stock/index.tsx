import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/product';
import { stockIn, stockOut } from '../../services/stock';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import { todayISO } from '../../utils';
import type { Product } from '../../types';

export default function Stock() {
  const [barcode, setBarcode] = useState('');
  const [qty, setQty] = useState(0);
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(todayISO());
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const mut = useMutation({
    mutationFn: (payload: { barcode: string; qty: number; tanggal?: string; keterangan?: string }) =>
      mode === 'in' ? stockIn(payload) : stockOut(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setBarcode('');
      setQty(0);
      setKeterangan('');
      setTanggal(todayISO());
      showToast(`Stock ${mode === 'in' ? 'masuk' : 'keluar'} berhasil`, 'success');
    },
    onError: () => showToast('Gagal mengupdate stock', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || qty <= 0) {
      showToast('Isi barcode dan jumlah dengan benar', 'error');
      return;
    }
    mut.mutate({ barcode, qty, tanggal, keterangan });
  };

  const produk = products.find((p) => p.barcode === barcode);

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Stock" subtitle="Stock in / stock out" />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-4 space-y-3 text-sm border border-gray-100"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('in')}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === 'in' ? 'bg-green-500 text-white' : 'bg-gray-100'
            }`}
          >
            Stock In
          </button>
          <button
            type="button"
            onClick={() => setMode('out')}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              mode === 'out' ? 'bg-red-500 text-white' : 'bg-gray-100'
            }`}
          >
            Stock Out
          </button>
        </div>
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
          placeholder="Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        {produk && (
          <div className="text-xs bg-blue-50 p-2 rounded text-blue-700">
            Produk: {produk.nama} (Stock: {produk.stock})
          </div>
        )}
        <input
          placeholder="Jumlah"
          type="number"
          value={qty || ''}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Keterangan (opsional)"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={mut.isPending}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold disabled:bg-gray-300"
        >
          {mut.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold text-gray-700 text-sm">Daftar Stock</h2>
        {isLoading ? (
          <Spinner />
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl p-3 border border-gray-100 flex justify-between items-center text-sm"
            >
              <div>
                <p className="font-medium text-gray-800">{p.nama}</p>
                <p className="text-xs text-gray-400">{p.barcode}</p>
              </div>
              <div
                className={`font-bold text-lg ${
                  p.stock < 10 ? 'text-red-500' : p.stock < 20 ? 'text-orange-500' : 'text-green-600'
                }`}
              >
                {p.stock}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}