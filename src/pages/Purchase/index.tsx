import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/product';
import { getSuppliers } from '../../services/supplier';
import { apiRequest } from '../../services/api';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import { todayISO } from '../../utils';
import type { Product, Supplier } from '../../types';

const inputClass = 'border rounded-lg px-3 py-2';

export default function Purchase() {
  const [supplier, setSupplier] = useState('');
  const [barcode, setBarcode] = useState('');
  const [qty, setQty] = useState(0);
  const [modal, setModal] = useState(0);
  const [tanggal, setTanggal] = useState(todayISO());
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const mut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest('/purchase', { body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setBarcode('');
      setQty(0);
      setModal(0);
      setTanggal(todayISO());
      showToast('Pembelian tersimpan', 'success');
    },
    onError: () => showToast('Gagal menyimpan pembelian', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !barcode || qty <= 0) {
      showToast('Lengkapi data pembelian', 'error');
      return;
    }
    mut.mutate({
      supplier,
      tanggal,
      barcode,
      qty,
      modal,
    });
  };

  const produk = products.find((p) => p.barcode === barcode);

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Pembelian" subtitle="Catat pembelian dari supplier" />

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
            className={`w-full ${inputClass}`}
            required
          />
        </div>
        <select
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className={`w-full ${inputClass}`}
          required
        >
          <option value="">Pilih Supplier...</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.nama}>
              {s.nama}
            </option>
          ))}
          <option value="lainnya">Lainnya</option>
        </select>
        <input
          placeholder="Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className={`w-full ${inputClass}`}
          required
        />
        {produk && (
          <div className="text-xs bg-blue-50 p-2 rounded text-blue-700">{produk.nama}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Jumlah"
            type="number"
            value={qty || ''}
            onChange={(e) => setQty(Number(e.target.value))}
            className={inputClass}
            required
          />
          <input
            placeholder="Modal/Satuan"
            type="number"
            value={modal || ''}
            onChange={(e) => setModal(Number(e.target.value))}
            className={inputClass}
            required
          />
        </div>
        <button
          type="submit"
          disabled={mut.isPending}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold disabled:bg-gray-300"
        >
          {mut.isPending ? 'Menyimpan...' : 'Simpan Pembelian'}
        </button>
      </form>

      {products.length === 0 && <Spinner />}
    </div>
  );
}