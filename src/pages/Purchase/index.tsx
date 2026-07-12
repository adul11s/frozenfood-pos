import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/product';
import { getSuppliers } from '../../services/supplier';
import { apiRequest } from '../../services/api';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import { todayISO, formatRupiah } from '../../utils';
import type { Product, Supplier } from '../../types';

const inputCls = 'w-full panel-2 px-3 py-2 text-frost outline-none';

export default function Purchase() {
  const [supplier, setSupplier] = useState('');
  const [productBarcode, setProductBarcode] = useState('');
  const [qty, setQty] = useState(0);
  const [modal, setModal] = useState(0);
  const [tanggal, setTanggal] = useState(todayISO());
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: getProducts });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ['suppliers'], queryFn: getSuppliers });

  const mut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiRequest('/purchase', { body: payload }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setProductBarcode(''); setQty(0); setModal(0); setTanggal(todayISO()); showToast('Pembelian tersimpan', 'success'); },
    onError: () => showToast('Gagal menyimpan pembelian', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !productBarcode || qty <= 0) { showToast('Lengkapi data pembelian', 'error'); return; }
    mut.mutate({ supplier, tanggal, barcode: productBarcode, qty, modal });
  };

  const produk = products.find((p) => p.barcode === productBarcode);

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Pembelian" subtitle="Catat pembelian dari supplier" />

      <form onSubmit={handleSubmit} className="panel p-4 space-y-3 text-sm">
        <div>
          <label className="text-xs text-frost-dim">Tanggal</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} required />
        </div>
        <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className={inputCls} required>
          <option value="">Pilih Supplier...</option>
          {suppliers.map((s) => <option key={s.id} value={s.nama}>{s.nama}</option>)}
          <option value="lainnya">Lainnya</option>
        </select>
        <select value={productBarcode} onChange={(e) => setProductBarcode(e.target.value)} className={inputCls} required>
          <option value="">Pilih Produk...</option>
          {products.map((p) => (
            <option key={p.id} value={p.barcode}>{p.nama}</option>
          ))}
        </select>
        {produk && <div className="text-xs bg-ice/8 p-2 rounded-lg text-ice border border-ice/20">{produk.nama} · Modal saat ini: {formatRupiah(produk.modal)}</div>}
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Jumlah" type="number" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} className={inputCls} required />
          <input placeholder="Modal/Satuan" type="number" value={modal || ''} onChange={(e) => setModal(Number(e.target.value))} className={inputCls} required />
        </div>
        <button type="submit" disabled={mut.isPending} className="w-full bg-gradient-to-r from-ice to-ice-dim text-bg-deep py-2 rounded-lg font-semibold disabled:opacity-35">
          {mut.isPending ? 'Menyimpan...' : 'Simpan Pembelian'}
        </button>
      </form>

      {products.length === 0 && <Spinner />}
    </div>
  );
}