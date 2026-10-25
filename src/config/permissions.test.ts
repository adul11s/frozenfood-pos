import { describe, expect, it } from 'vitest';
import { canAccess, getMenusByRole } from './permissions';

describe('canAccess', () => {
  it('owner bisa akses semua halaman termasuk modal', () => {
    expect(canAccess('/', 'owner')).toBe(true);
    expect(canAccess('/sales', 'owner')).toBe(true);
    expect(canAccess('/capital', 'owner')).toBe(true);
    expect(canAccess('/setting', 'owner')).toBe(true);
  });

  it('admin tidak bisa akses modal (capital)', () => {
    expect(canAccess('/sales', 'admin')).toBe(true);
    expect(canAccess('/report', 'admin')).toBe(true);
    expect(canAccess('/capital', 'admin')).toBe(false);
  });

  it('kasir hanya bisa akses menu terbatas', () => {
    expect(canAccess('/', 'kasir')).toBe(true);
    expect(canAccess('/sales', 'kasir')).toBe(true);
    expect(canAccess('/purchase', 'kasir')).toBe(false);
    expect(canAccess('/expense', 'kasir')).toBe(false);
    expect(canAccess('/capital', 'kasir')).toBe(false);
  });

  it('role tak dikenal ditolak semua halaman', () => {
    expect(canAccess('/sales', 'guest' as never)).toBe(false);
  });

  it('daftar menu per role konsisten dengan canAccess', () => {
    (['owner', 'admin', 'kasir'] as const).forEach((role) => {
      const menuPaths = getMenusByRole(role).map((m) => m.path);
      menuPaths.forEach((path) => expect(canAccess(path, role)).toBe(true));
    });
  });
});
