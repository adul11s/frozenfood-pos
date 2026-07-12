import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getMenusByRole } from '../config/permissions';

export default function Navbar() {
  const location = useLocation();
  const { user } = useStore();
  const menus = getMenusByRole(user?.role || 'kasir');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-panel border-t border-line z-40">
      <div className="flex overflow-x-auto scrollbar-hide">
        {menus.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className={`flex flex-col items-center py-2 px-2 min-w-[56px] text-[10px] gap-0.5 flex-shrink-0 transition-colors ${
              location.pathname === m.path ? 'text-ice' : 'text-frost-dim'
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