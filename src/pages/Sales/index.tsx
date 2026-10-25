import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/product';
import { createSale } from '../../services/sales';
import { useStore } from '../../store/useStore';
import { formatRupiah, generateInvoice } from '../../utils';
import ThermalPrinter from '../../components/receipt/ThermalPrinter';
import { savePendingSale } from '../../utils/db';
import { useToast } from '../../hooks/useToast';
import type { Product, CartItem, SaleDetail } from '../../types';

export default function Sales() {
  const [diskon, setDiskon] = useState(0);
  const [bayar, setBayar] = useState('');
  const [search, setSearch] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Record<string, unknown> | null>(null);
  const [metode, setMetode] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [category, setCategory] = useState('semua');

  const {
    cart, addToCart, removeFromCart, updateCartQty, clearCart, getCartTotal, isOnline, user,
  } = useStore();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { subtotal } = getCartTotal();
  const total = subtotal - diskon;
  const kembali = Math.max(0, Number(bayar) - total);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const saleMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createSale(payload as never),
    onSuccess: (data, payload) => {
      if (data.success) {
        const sale = { ...payload, invoice: data.invoice || payload.invoice, tanggal: new Date() };
        setLastSale(sale);
        setShowReceipt(true);
        clearCart();
        setDiskon(0);
        setBayar('');
        qc.invalidateQueries({ queryKey: ['dashboard'] });
        qc.invalidateQueries({ queryKey: ['products'] });
        qc.invalidateQueries({ queryKey: ['chart'] });
        showToast('Transaksi berhasil', 'success');
      }
    },
    onError: () => showToast('Gagal menyimpan transaksi', 'error'),
  });

  const categories = ['semua', ...Array.from(new Set(products.map((p) => p.kategori)))];
  const filtered = products.filter((p) => {
    const matchCat = category === 'semua' || p.kategori === category;
    const matchQ = p.nama.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (Number(bayar) < total && metode === 'cash') {
      showToast('Pembayaran kurang', 'error');
      return;
    }

    const invoice = generateInvoice();
    const details: SaleDetail[] = cart.map((c) => ({
      invoice, barcode: c.barcode, produk: c.nama, qty: c.qty,
      harga: c.harga, modal: c.modal / c.qty,
      profit: (c.harga - c.modal / c.qty) * c.qty,
    }));

    const payload = {
      invoice, kasir: user?.nama || 'admin', subtotal, diskon, total,
      bayar: Number(bayar) || total, kembali, metode, details,
    };

    if (isOnline) {
      saleMutation.mutate(payload);
    } else {
      await savePendingSale(payload);
      setLastSale(payload);
      setShowReceipt(true);
      clearCart();
      setDiskon(0);
      setBayar('');
      showToast('Transaksi disimpan offline', 'info');
    }
  };

  const metodeButtons: { val: 'cash' | 'qris' | 'transfer'; label: string; icon: string }[] = [
    { val: 'cash', label: 'Tunai', icon: '💵' },
    { val: 'qris', label: 'QRIS', icon: '📱' },
    { val: 'transfer', label: 'Transfer', icon: '🏦' },
  ];

  const stockDot = (stock: number) => {
    if (stock === 0) return 'bg-alert';
    if (stock <= 5) return 'bg-amber';
    return 'bg-mint';
  };

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      {/* Search */}
      <input
        autoFocus
        className="w-full panel-2 px-3 py-2 text-sm text-frost placeholder:text-frost-dim outline-none"
        placeholder="Cari produk..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              category === c
                ? 'cat-btn-active border'
                : 'panel-2 text-frost-dim border border-transparent'
            }`}
          >
            {c === 'semua' ? '🧊 Semua' : c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-auto scrollbar-hide max-h-60">
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p, 1)}
              disabled={p.stock <= 0}
              className="panel p-2.5 text-left transition hover:border-ice/40 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {p.stock <= 0 && (
                <span className="absolute top-1.5 right-1.5 bg-alert text-white text-[9px] font-bold px-1.5 py-0.5 rounded">HABIS</span>
              )}
              <div className="w-10 h-10 rounded-xl bg-ice/8 flex items-center justify-center text-xl mb-2">🧊</div>
              <p className="text-xs font-bold text-frost truncate">{p.nama}</p>
              <div className="flex items-center gap-1.5 my-1">
                <span className={`w-1.5 h-1.5 rounded-full ${stockDot(p.stock)}`} />
                <span className="text-[10px] text-frost-dim">Stok {p.stock}</span>
              </div>
              <div className="price-tag inline-block">{formatRupiah(p.ecer)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="panel divide-y divide-line max-h-40 overflow-auto">
        {cart.length === 0 ? (
          <p className="text-center text-frost-dim py-6 text-sm">Keranjang kosong</p>
        ) : (
          (cart as CartItem[]).map((item) => (
            <div key={item.barcode} className="flex items-center justify-between px-3 py-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-frost truncate">{item.nama}</p>
                <p className="text-xs text-frost-dim font-mono">
                  {item.qty} x {formatRupiah(item.harga)} = {formatRupiah(item.subtotal)}
                  {item.qty >= item.minGrosir && <span className="ml-1 text-mint text-[10px]">GROSIR</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateCartQty(item.barcode, item.qty - 1)} className="w-6 h-6 panel-2 rounded text-frost flex items-center justify-center text-xs">-</button>
                <span className="w-5 text-center text-frost font-mono text-sm">{item.qty}</span>
                <button onClick={() => updateCartQty(item.barcode, item.qty + 1)} className="w-6 h-6 panel-2 rounded text-frost flex items-center justify-center text-xs">+</button>
                <button onClick={() => removeFromCart(item.barcode)} className="text-alert text-xs ml-1">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals + payment */}
      <div className="panel p-4 space-y-2 text-sm">
        <div className="flex justify-between text-frost-dim">
          <span>Subtotal</span>
          <span className="font-mono">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-frost-dim">
          <span>Diskon</span>
          <input
            type="number"
            value={diskon}
            onChange={(e) => setDiskon(Number(e.target.value))}
            className="w-28 text-right panel-2 px-2 py-1 text-frost font-mono outline-none"
          />
        </div>
        <div className="flex justify-between text-lg font-bold text-frost font-mono border-t border-line pt-2">
          <span>Total</span>
          <span className="text-ice">{formatRupiah(total)}</span>
        </div>

        <div className="flex gap-2 pt-1">
          {metodeButtons.map((m) => (
            <button
              key={m.val}
              onClick={() => setMetode(m.val)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                metode === m.val
                  ? 'border border-ice text-ice bg-ice/10'
                  : 'panel-2 text-frost-dim border border-transparent'
              }`}
            >
              <div className="text-base">{m.icon}</div>
              {m.label}
            </button>
          ))}
        </div>

        {metode === 'cash' && (
          <div className="space-y-1">
            <label className="text-xs text-frost-dim">Uang diterima</label>
            <input
              type="number"
              value={bayar}
              onChange={(e) => setBayar(e.target.value)}
              placeholder="0"
              className="w-full panel-2 px-3 py-2 text-frost font-mono text-sm outline-none"
            />
            <div className="flex justify-between text-xs text-frost-dim">
              <span>Kembalian</span>
              <span className={`font-mono ${kembali > 0 ? 'text-mint' : ''}`}>{formatRupiah(kembali)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Checkout buttons */}
      <div className="flex gap-3">
        <button
          onClick={clearCart}
          className="flex-1 panel-2 text-frost-dim py-3 rounded-xl font-semibold text-sm"
        >
          RESET
        </button>
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || saleMutation.isPending}
          className="flex-[2] bg-gradient-to-r from-ice to-ice-dim text-bg-deep py-3 rounded-xl font-bold text-base disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {saleMutation.isPending ? 'MEMPROSES...' : `BAYAR ${formatRupiah(total)}`}
        </button>
      </div>

      {/* Receipt modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:relative print:bg-white print:p-0">
          <div className="panel w-full max-w-sm p-6 space-y-4 print:max-w-full print:rounded-none print:p-0 print:bg-frost">
            <h2 className="font-bold text-center font-display text-frost print:hidden">Cetak Nota</h2>
            <div className="flex items-center justify-center gap-2 mb-2 print:hidden">
              <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04140d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-mint font-bold">Pembayaran Berhasil</span>
            </div>
            <ThermalPrinter sale={lastSale} onClose={() => setShowReceipt(false)} />
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="bg-alert/15 text-alert text-xs p-2 rounded text-center border border-alert/20">
          Mode Offline — Transaksi disimpan, sinkronisasi saat online
        </div>
      )}
    </div>
  );
}