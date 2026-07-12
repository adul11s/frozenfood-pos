import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { getPendingSales } from '../../utils/db';
import { useToast } from '../../hooks/useToast';
import { ROLE_LABELS } from '../../config/permissions';

export default function Setting() {
  const { isOnline, user, setUser } = useStore();
  const { showToast } = useToast();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isOnline) { getPendingSales().then((s) => setPendingCount(s.length)); } else { setPendingCount(0); }
  }, [isOnline]);

  const handleLogout = () => { if (confirm('Yakin ingin keluar?')) { setUser(null); showToast('Berhasil logout', 'info'); } };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold font-display text-frost">Pengaturan</h1>

      <div className="panel p-4 text-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-frost-dim">Status Koneksi</span>
          <span className={`font-bold ${isOnline ? 'text-mint' : 'text-alert'}`}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-frost-dim">User</span>
          <span className="font-medium text-frost">{user?.nama || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-frost-dim">Role</span>
          <span className="font-medium text-ice">{user ? ROLE_LABELS[user.role] : '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-frost-dim">Nama Toko</span>
          <span className="font-medium text-frost">TOKO FROZEN FOOD</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-frost-dim">Receipt</span>
          <span className="font-medium text-frost">58mm / 80mm Thermal</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-frost-dim">PWA Version</span>
          <span className="font-medium text-frost font-mono">1.0.0</span>
        </div>
        {!isOnline && pendingCount > 0 && (
          <div className="bg-amber/10 text-amber text-xs p-2 rounded border border-amber/20">
            {pendingCount} transaksi menunggu sinkronisasi
          </div>
        )}
      </div>

      <div className="panel p-4 border-ice/20 bg-ice/5 text-xs text-ice space-y-1">
        <p className="font-semibold">Tips:</p>
        <p>· Install ke Home Screen untuk pengalaman app native</p>
        <p>· Transaksi offline otomatis tersimpan dan sync saat online</p>
      </div>

      <button onClick={handleLogout} className="w-full bg-alert text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition">
        Logout
      </button>
    </div>
  );
}