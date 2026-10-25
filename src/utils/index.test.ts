import { describe, expect, it } from 'vitest';
import { getHarga } from './index';

const produk = { ecer: 10000, grosir: 8000, minGrosir: 6 };

describe('getHarga (harga grosir vs ecer)', () => {
  it('pakai harga ecer saat qty di bawah minimum grosir', () => {
    expect(getHarga(produk, 1)).toBe(10000);
    expect(getHarga(produk, 5)).toBe(10000);
  });

  it('pakai harga ecer saat minGrosir 0 tidak pernah tercapai (qty 0)', () => {
    expect(getHarga(produk, 0)).toBe(10000);
  });

  it('pakai harga grosir tepat di batas minimum', () => {
    expect(getHarga(produk, 6)).toBe(8000);
  });

  it('pakai harga grosir di atas minimum', () => {
    expect(getHarga(produk, 12)).toBe(8000);
  });

  it('menangani produk tanpa promo grosir (minGrosir sangat besar)', () => {
    const tanpaGrosir = { ecer: 5000, grosir: 1000, minGrosir: 999999 };
    expect(getHarga(tanpaGrosir, 100)).toBe(5000);
  });
});
