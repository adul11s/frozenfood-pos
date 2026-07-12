import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/supplier';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { Supplier as SupplierType } from '../../types';

const empty = { id: '', nama: '', telepon: '', alamat: '' };

export default function Supplier() {
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<SupplierType[]>({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Omit<SupplierType, 'id'>) =>
      editing
        ? updateSupplier(editing, payload)
        : createSupplier(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setForm(empty);
      setEditing(null);
      showToast(editing ? 'Supplier diperbarui' : 'Supplier ditambahkan', 'success');
    },
    onError: () => showToast('Gagal menyimpan supplier', 'error'),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      showToast('Supplier dihapus', 'success');
    },
    onError: () => showToast('Gagal menghapus supplier', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleEdit = (s: SupplierType) => {
    setForm(s);
    setEditing(s.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus supplier?')) delMutation.mutate(id);
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Supplier" subtitle="Kelola data supplier" />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-4 space-y-3 text-sm border border-gray-100"
      >
        <input
          placeholder="Nama Supplier"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <input
          placeholder="Telepon"
          value={form.telepon}
          onChange={(e) => setForm({ ...form, telepon: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Alamat"
          value={form.alamat}
          onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />
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
          {suppliers.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">Belum ada supplier</p>
          ) : (
            suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-start text-sm"
              >
                <div>
                  <p className="font-semibold text-gray-800">{s.nama}</p>
                  <p className="text-xs text-gray-400">{s.telepon || '-'}</p>
                  <p className="text-xs text-gray-500">{s.alamat || '-'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(s)}
                    className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
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