import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/product';
import { formatRupiah } from '../../utils';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { Product as ProductType } from '../../types';

const empty: Omit<ProductType, 'id'> = {
  barcode: '', nama: '', kategori: 'Frozen', modal: 0, ecer: 0, grosir: 0, minGrosir: 5, stock: 0, expired: '',
};

const inputCls = 'panel-2 px-3 py-2 text-frost placeholder:text-frost-dim outline-none focus:border-ice-dim transition-colors';

export default function Product() {
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: products = [], isLoading } = useQuery<ProductType[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Omit<ProductType, 'id'>) =>
      editing ? updateProduct(editing, payload) : createProduct(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setForm(empty); setEditing(null); showToast(editing ? 'Produk diperbarui' : 'Produk ditambahkan', 'success'); },
    onError: () => showToast('Gagal menyimpan produk', 'error'),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); showToast('Produk dihapus', 'success'); },
    onError: () => showToast('Gagal menghapus produk', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, barcode: form.barcode || `P${Date.now()}` };
    saveMutation.mutate(payload);
  };
  const handleEdit = (p: ProductType) => { const { id: _id, ...rest } = p; void _id; setForm(rest); setEditing(p.id); };
  const handleDelete = (id: string) => { if (confirm('Hapus produk?')) delMutation.mutate(id); };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Produk" subtitle="Kelola data produk" />

      <form onSubmit={handleSubmit} className="panel p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Nama Produk" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className={inputCls} required />
          <input placeholder="Kategori" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className={inputCls} />
          <input type="date" value={form.expired} onChange={(e) => setForm({ ...form, expired: e.target.value })} className={inputCls} />
          <input placeholder="Modal" type="number" value={form.modal || ''} onChange={(e) => setForm({ ...form, modal: Number(e.target.value) })} className={inputCls} required />
          <input placeholder="Ecer" type="number" value={form.ecer || ''} onChange={(e) => setForm({ ...form, ecer: Number(e.target.value) })} className={inputCls} required />
          <input placeholder="Grosir" type="number" value={form.grosir || ''} onChange={(e) => setForm({ ...form, grosir: Number(e.target.value) })} className={inputCls} required />
          <input placeholder="Min Grosir" type="number" value={form.minGrosir || ''} onChange={(e) => setForm({ ...form, minGrosir: Number(e.target.value) })} className={inputCls} required />
          <input placeholder="Stock" type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={inputCls} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-gradient-to-r from-ice to-ice-dim text-bg-deep py-2 rounded-lg font-semibold">{editing ? 'Update' : 'Tambah'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="flex-1 panel-2 text-frost-dim py-2 rounded-lg">Batal</button>}
        </div>
      </form>

      {isLoading ? <Spinner /> : (
        <div className="space-y-2">
          {products.length === 0 ? <p className="text-center text-frost-dim py-6 text-sm">Belum ada produk</p> : (
            products.map((p) => (
              <div key={p.id} className="panel p-4 flex justify-between items-start text-sm">
                <div>
                  <p className="font-semibold text-frost">{p.nama}</p>
                  <p className="text-xs text-frost-dim">{p.kategori}</p>
                  <p className="text-xs text-frost-dim mt-1">Modal: {formatRupiah(p.modal)} · Ecer: {formatRupiah(p.ecer)} · Grosir: {formatRupiah(p.grosir)} (min {p.minGrosir})</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.stock === 0 ? 'bg-alert' : p.stock <= 5 ? 'bg-amber' : 'bg-mint'}`} />
                    <span className="text-xs text-amber">Stok: {p.stock}</span>
                    <span className="text-xs text-frost-dim">Exp: {p.expired}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="text-ice text-xs border border-ice/30 px-2 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-alert text-xs border border-alert/30 px-2 py-1 rounded">Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}