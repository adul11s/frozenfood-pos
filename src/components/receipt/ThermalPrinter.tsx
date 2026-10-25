import { formatRupiah, formatDateTime } from '../../utils';

interface ThermalPrinterProps {
  sale: Record<string, unknown>;
  size?: '58mm' | '80mm';
  onClose: () => void;
}

export default function ThermalPrinter({
  sale,
  size = '58mm',
  onClose,
}: ThermalPrinterProps) {
  const cart = (sale.details || []) as Array<{
    nama: string;
    qty: number;
    harga: number;
    subtotal: number;
  }>;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .receipt-print, .receipt-print * { visibility: visible !important; }
          .receipt-print {
            position: absolute; left: 0; top: 0; width: 100%;
          }
          .receipt-print .no-print { display: none !important; }
        }
      `}</style>

      <div className="receipt-print space-y-3">
        <div
          className="rounded-xl mx-auto text-[11px] p-3"
          style={{
            width: size === '58mm' ? 180 : 220,
            background: 'var(--color-frost)',
            color: '#0d2233',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div className="text-center font-bold">BIOS FROZEN FOOD</div>
          <div className="text-center my-1">{'-'.repeat(32)}</div>

          <div className="flex justify-between">
            <span>No</span>
            <span>{String(sale.invoice || '')}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal</span>
            <span>{formatDateTime(sale.tanggal ? new Date(sale.tanggal as string) : new Date())}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir</span>
            <span>{String(sale.kasir || '')}</span>
          </div>
          <div className="text-center my-1">{'-'.repeat(32)}</div>

          {cart.map((item, i) => (
            <div key={i} className="mt-1">
              <div className="flex justify-between">
                <span>{item.nama}</span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>
                  {item.qty} x {formatRupiah(item.harga)}
                </span>
              </div>
            </div>
          ))}

          <div className="my-1 border-t pt-1" style={{ borderColor: '#b9c9d4' }}>
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatRupiah(sale.total as number)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar</span>
              <span>{formatRupiah(sale.bayar as number)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembali</span>
              <span>{formatRupiah(sale.kembali as number)}</span>
            </div>
          </div>

          <div className="text-center my-1">{'-'.repeat(32)}</div>
          <div className="text-center">Terima kasih</div>
        </div>

        <div className="no-print flex gap-2 justify-center">
          <button
            onClick={() => window.print()}
            className="px-4 py-1 rounded text-xs bg-gradient-to-r from-ice to-ice-dim text-bg-deep font-bold"
          >
            PRINT
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded text-xs bg-bg-panel-2 text-frost-dim border border-line"
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}