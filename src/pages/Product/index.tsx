import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/product';
import { formatRupiah } from '../../utils';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { Product as ProductType } from '../../types';

const empty: Omit<ProductType, 'id'> = {
  barcode: '',
  nama: '',
  kategori: 'Frozen',
  modal: 0,
  ecer: 0,
  grosir: 0,
  minGrosir: 5,
  stock: 0,
  expired: '',
};

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
      editing
        ? updateProduct(editing, payload)
        : createProduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setForm(empty);
      setEditing(null);
      showToast(editing ? 'Produk diperbarui' : 'Produk ditambahkan', 'success');
    },
    onError: () => showToast('Gagal menyimpan produk', 'error'),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      showToast('Produk dihapus', 'success');
    },
    onError: () => showToast('Gagal menghapus produk', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleEdit = (p: ProductType) => {
    const { id: _id, ...rest } = p;
    void _id;
    setForm(rest);
    setEditing(p.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus produk?')) delMutation.mutate(id);
  };

  const inputClass = 'border rounded-lg px-3 py-2';

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Produk" subtitle="Kelola data produk" />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-4 space-y-3 text-sm border border-gray-100"
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Barcode"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            className={inputClass}
            required
          />
          <input
            placeholder="Nama Produk"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className={inputClass}
            required
          />
          <input
            placeholder="Kategori"
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            className={inputClass}
          />
          <input
            type="date"
            placeholder="Expired"
            value={form.expired}
            onChange={(e) => setForm({ ...form, expired: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Modal"
            type="number"
            value={form.modal || ''}
            onChange={(e) => setForm({ ...form, modal: Number(e.target.value) })}
            className={inputClass}
            required
          />
          <input
            placeholder="Ecer"
            type="number"
            value={form.ecer || ''}
            onChange={(e) => setForm({ ...form, ecer: Number(e.target.value) })}
            className={inputClass}
            required
          />
          <input
            placeholder="Grosir"
            type="number"
            value={form.grosir || ''}
            onChange={(e) => setForm({ ...form, grosir: Number(e.target.value) })}
            className={inputClass}
            required
          />
          <input
            placeholder="Min Grosir"
            type="number"
            value={form.minGrosir || ''}
            onChange={(e) => setForm({ ...form, minGrosir: Number(e.target.value) })}
            className={inputClass}
            required
          />
          <input
            placeholder="Stock"
            type="number"
            value={form.stock || ''}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold"
          >
            {editing ? 'Update' : 'Tambah'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
              className="flex-1 bg-gray-200 py-2 rounded-lg"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {products.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">Belum ada produk</p>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-start text-sm"
              >
                <div>
                  <p className="font-semibold text-gray-800">{p.nama}</p>
                  <p className="text-xs text-gray-400">
                    {p.barcode} - {p.kategori}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Modal: {formatRupiah(p.modal)} | Ecer: {formatRupiah(p.ecer)} | Grosir:{' '}
                    {formatRupiah(p.grosir)} (min {p.minGrosir})
                  </p>
                  <p className="text-xs text-orange-500">
                    Stock: {p.stock} | Exp: {p.expired}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}