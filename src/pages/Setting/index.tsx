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
    if (!isOnline) {
      getPendingSales().then((s) => setPendingCount(s.length));
    } else {
      setPendingCount(0);
    }
  }, [isOnline]);

  const handleLogout = () => {
    if (confirm('Yakin ingin keluar?')) {
      setUser(null);
      showToast('Berhasil logout', 'info');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Pengaturan</h1>

      <div className="bg-white rounded-xl p-4 border border-gray-100 text-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status Koneksi</span>
          <span className={`font-bold ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">User</span>
          <span className="font-medium">{user?.nama || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Role</span>
          <span className="font-medium">{user ? ROLE_LABELS[user.role] : '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Nama Toko</span>
          <span className="font-medium">TOKO FROZEN FOOD</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Receipt</span>
          <span className="font-medium">58mm / 80mm Thermal</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">PWA Version</span>
          <span className="font-medium">1.0.0</span>
        </div>
        {!isOnline && pendingCount > 0 && (
          <div className="bg-yellow-50 text-yellow-700 text-xs p-2 rounded">
            {pendingCount} transaksi menunggu sinkronisasi
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">Tips:</p>
        <p>- Install ke Home Screen untuk pengalaman app native</p>
        <p>- Transaksi offline otomatis tersimpan dan sync saat online</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}