import type { UserRole } from '../types';

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

export const MENUS: MenuItem[] = [
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

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    '/', '/sales', '/products', '/purchase', '/stock',
    '/supplier', '/expense', '/capital', '/report', '/setting',
  ],
  admin: [
    '/', '/sales', '/products', '/purchase', '/stock',
    '/supplier', '/expense', '/report', '/setting',
  ],
  kasir: [
    '/', '/sales', '/products', '/stock', '/setting',
  ],
};

export const getMenusByRole = (role: UserRole): MenuItem[] => {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return MENUS.filter((m) => allowed.includes(m.path));
};

export const canAccess = (path: string, role: UserRole): boolean => {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(path);
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  kasir: 'Kasir',
};