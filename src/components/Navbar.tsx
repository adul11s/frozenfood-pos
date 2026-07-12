import { Link, useLocation } from 'react-router-dom';

const menus = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/sales', icon: '💰', label: 'Kasir' },
  { path: '/products', icon: '📦', label: 'Produk' },
  { path: '/purchase', icon: '🛒', label: 'Pembelian' },
  { path: '/stock', icon: '📊', label: 'Stock' },
  { path: '/supplier', icon: '🚚', label: 'Supplier' },
  { path: '/expense', icon: '💸', label: 'Pengeluaran' },
  { path: '/capital', icon: '🏦', label: 'Modal' },
  { path: '/report', icon: '📈', label: 'Laporan' },
  { path: '/setting', icon: '⚙️', label: 'Pengaturan' },
];

export default function Navbar() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex overflow-x-auto scrollbar-hide">
        {menus.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className={`flex flex-col items-center py-2 px-2 min-w-[56px] text-[10px] gap-0.5 flex-shrink-0 ${
              location.pathname === m.path ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <span className="text-base leading-none">{m.icon}</span>
            <span>{m.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}