import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/supplier';
import { PageHeader, Spinner } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { Supplier as SupplierType } from '../../types';

const empty = { id: '', nama: '', telepon: '', alamat: '' };
const inputCls = 'w-full panel-2 px-3 py-2 text-frost placeholder:text-frost-dim outline-none';

export default function Supplier() {
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<SupplierType[]>({ queryKey: ['suppliers'], queryFn: getSuppliers });

  const saveMutation = useMutation({
    mutationFn: (payload: Omit<SupplierType, 'id'>) => editing ? updateSupplier(editing, payload) : createSupplier(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setForm(empty); setEditing(null); showToast(editing ? 'Supplier diperbarui' : 'Supplier ditambahkan', 'success'); },
    onError: () => showToast('Gagal menyimpan supplier', 'error'),
  });
  const delMutation = useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); showToast('Supplier dihapus', 'success'); },
    onError: () => showToast('Gagal menghapus supplier', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); saveMutation.mutate(form); };
  const handleEdit = (s: SupplierType) => { setForm(s); setEditing(s.id); };
  const handleDelete = (id: string) => { if (confirm('Hapus supplier?')) delMutation.mutate(id); };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Supplier" subtitle="Kelola data supplier" />

      <form onSubmit={handleSubmit} className="panel p-4 space-y-3 text-sm">
        <input placeholder="Nama Supplier" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className={inputCls} required />
        <input placeholder="Telepon" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} className={inputCls} />
        <input placeholder="Alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className={inputCls} />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-gradient-to-r from-ice to-ice-dim text-bg-deep py-2 rounded-lg font-semibold">{editing ? 'Update' : 'Tambah'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="flex-1 panel-2 text-frost-dim py-2 rounded-lg">Batal</button>}
        </div>
      </form>

      {isLoading ? <Spinner /> : (
        <div className="space-y-2">
          {suppliers.length === 0 ? <p className="text-center text-frost-dim py-6 text-sm">Belum ada supplier</p> : suppliers.map((s) => (
            <div key={s.id} className="panel p-4 flex justify-between items-start text-sm">
              <div>
                <p className="font-semibold text-frost">{s.nama}</p>
                <p className="text-xs text-frost-dim">{s.telepon || '-'}</p>
                <p className="text-xs text-frost-dim">{s.alamat || '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(s)} className="text-ice text-xs border border-ice/30 px-2 py-1 rounded">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="text-alert text-xs border border-alert/30 px-2 py-1 rounded">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}