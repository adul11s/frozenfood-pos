import { useState, useRef } from 'react';
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
  const barcodeRef = useRef<HTMLInputElement>(null);

  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    getCartTotal,
    isOnline,
    user,
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
        const sale = { ...payload, invoice: data.invoice || payload.invoice };
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

  const filtered = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search),
  );

  const handleBarcode = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      addToCart(product, 1);
      setSearch('');
    } else {
      showToast('Barcode tidak ditemukan', 'error');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (Number(bayar) < total) {
      showToast('Pembayaran kurang', 'error');
      return;
    }

    const invoice = generateInvoice();
    const details: SaleDetail[] = cart.map((c) => ({
      invoice,
      barcode: c.barcode,
      produk: c.nama,
      qty: c.qty,
      harga: c.harga,
      modal: c.modal / c.qty,
      profit: (c.harga - c.modal / c.qty) * c.qty,
    }));

    const payload = {
      invoice,
      kasir: user?.nama || 'admin',
      subtotal,
      diskon,
      total,
      bayar: Number(bayar) || total,
      kembali,
      metode,
      details,
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

  const metodeButtons: { val: 'cash' | 'qris' | 'transfer'; label: string }[] = [
    { val: 'cash', label: 'Tunai' },
    { val: 'qris', label: 'QRIS' },
    { val: 'transfer', label: 'Transfer' },
  ];

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      <div className="flex gap-2">
        <input
          ref={barcodeRef}
          autoFocus
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Scan / Ketik Barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleBarcode(search)}
        />
        <button
          onClick={() => barcodeRef.current?.focus()}
          className="bg-blue-500 text-white px-4 rounded-lg text-sm font-medium"
        >
          SCAN
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-100 p-3 max-h-60">
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p, 1)}
              disabled={p.stock <= 0}
              className="bg-blue-50 hover:bg-blue-100 disabled:opacity-50 rounded-lg p-2 text-left border border-blue-100 transition"
            >
              <p className="text-xs font-semibold text-gray-800 truncate">{p.nama}</p>
              <p className="text-xs text-blue-600 font-bold">{formatRupiah(p.ecer)}</p>
              <p className="text-[10px] text-gray-400">Stock: {p.stock}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 max-h-48 overflow-auto">
        {cart.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">Keranjang kosong</p>
        ) : (
          (cart as CartItem[]).map((item) => (
            <div
              key={item.barcode}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.nama}</p>
                <p className="text-xs text-gray-400">
                  {item.qty} x {formatRupiah(item.harga)} = {formatRupiah(item.subtotal)}
                  {item.qty >= item.minGrosir && (
                    <span className="ml-1 text-green-500 text-[10px]">GROSIR</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCartQty(item.barcode, item.qty - 1)}
                  className="w-7 h-7 bg-gray-100 rounded text-sm"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm">{item.qty}</span>
                <button
                  onClick={() => updateCartQty(item.barcode, item.qty + 1)}
                  className="w-7 h-7 bg-gray-100 rounded text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(item.barcode)}
                  className="text-red-400 text-xs ml-2"
                >
                  x
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-bold">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Diskon</span>
          <input
            type="number"
            value={diskon}
            onChange={(e) => setDiskon(Number(e.target.value))}
            className="w-28 text-right border rounded px-2 py-1"
          />
        </div>
        <div className="flex justify-between text-base font-bold border-t pt-2">
          <span>Total</span>
          <span className="text-blue-600">{formatRupiah(total)}</span>
        </div>
        <div className="flex gap-2">
          {metodeButtons.map((m) => (
            <button
              key={m.val}
              onClick={() => setMetode(m.val)}
              className={`flex-1 py-1 rounded text-xs font-medium ${
                metode === m.val ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span>Bayar</span>
          <input
            type="number"
            value={bayar}
            onChange={(e) => setBayar(e.target.value)}
            placeholder="0"
            className="w-36 text-right border rounded px-2 py-1 font-medium"
          />
        </div>
        <div className="flex justify-between text-green-600">
          <span>Kembali</span>
          <span className="font-bold">{formatRupiah(kembali)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={clearCart}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold text-sm"
        >
          RESET
        </button>
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || saleMutation.isPending}
          className="flex-[2] bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-base"
        >
          {saleMutation.isPending ? 'MEMPROSES...' : `BAYAR ${formatRupiah(total)}`}
        </button>
      </div>

      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:relative print:bg-white print:p-0">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 print:max-w-full print:rounded-none print:p-0">
            <h2 className="font-bold text-center print:hidden">Cetak Nota</h2>
            <ThermalPrinter sale={lastSale} onClose={() => setShowReceipt(false)} />
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded text-center">
          Mode Offline - Transaksi disimpan, sinkronisasi saat online
        </div>
      )}
    </div>
  );
}