import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/product';
import { stockIn, stockOut } from '../../services/stock';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import { todayISO } from '../../utils';
import type { Product } from '../../types';

const inputCls = 'w-full panel-2 px-3 py-2 text-frost placeholder:text-frost-dim outline-none';

export default function Stock() {
  const [barcode, setBarcode] = useState('');
  const [qty, setQty] = useState(0);
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(todayISO());
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ['products'], queryFn: getProducts });

  const mut = useMutation({
    mutationFn: (payload: { barcode: string; qty: number; tanggal?: string; keterangan?: string }) =>
      mode === 'in' ? stockIn(payload) : stockOut(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setBarcode(''); setQty(0); setKeterangan(''); setTanggal(todayISO()); showToast(`Stock ${mode === 'in' ? 'masuk' : 'keluar'} berhasil`, 'success'); },
    onError: () => showToast('Gagal mengupdate stock', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || qty <= 0) { showToast('Isi barcode dan jumlah dengan benar', 'error'); return; }
    mut.mutate({ barcode, qty, tanggal, keterangan });
  };

  const produk = products.find((p) => p.barcode === barcode);
  const stockColor = (s: number) => s === 0 ? 'text-alert' : s <= 5 ? 'text-amber' : s < 20 ? 'text-amber' : 'text-mint';

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Stock" subtitle="Stock in / stock out" />

      <form onSubmit={handleSubmit} className="panel p-4 space-y-3 text-sm">
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('in')} className={`flex-1 py-2 rounded-lg font-semibold ${mode === 'in' ? 'bg-mint text-bg-deep' : 'panel-2 text-frost-dim'}`}>Stock In</button>
          <button type="button" onClick={() => setMode('out')} className={`flex-1 py-2 rounded-lg font-semibold ${mode === 'out' ? 'bg-alert text-white' : 'panel-2 text-frost-dim'}`}>Stock Out</button>
        </div>
        <div>
          <label className="text-xs text-frost-dim">Tanggal</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} required />
        </div>
        <input placeholder="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputCls} />
        {produk && <div className="text-xs bg-ice/8 p-2 rounded-lg text-ice border border-ice/20">Produk: {produk.nama} (Stok: {produk.stock})</div>}
        <input placeholder="Jumlah" type="number" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} className={inputCls} />
        <input placeholder="Keterangan (opsional)" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className={inputCls} />
        <button type="submit" disabled={mut.isPending} className="w-full bg-gradient-to-r from-ice to-ice-dim text-bg-deep py-2 rounded-lg font-semibold disabled:opacity-35">{mut.isPending ? 'Menyimpan...' : 'Simpan'}</button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold text-frost-dim text-sm">Daftar Stock</h2>
        {isLoading ? <Spinner /> : products.map((p) => (
          <div key={p.id} className="panel p-3 flex justify-between items-center text-sm">
            <div><p className="font-medium text-frost">{p.nama}</p><p className="text-xs text-frost-dim">{p.barcode}</p></div>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${p.stock === 0 ? 'bg-alert' : p.stock <= 5 ? 'bg-amber' : 'bg-mint'}`} />
              <span className={`font-bold text-lg font-mono ${stockColor(p.stock)}`}>{p.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}