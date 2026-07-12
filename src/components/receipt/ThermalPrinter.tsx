import { formatRupiah, formatDate } from '../../utils';

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
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .receipt-print .no-print { display: none !important; }
        }
      `}</style>

      <div className="receipt-print space-y-3">
        <div
          className="border-2 border-dashed border-gray-300 rounded mx-auto text-[11px]"
          style={{
            width: size === '58mm' ? 180 : 220,
            padding: 12,
            fontFamily: 'monospace',
          }}
        >
          <div className="text-center font-bold">TOKO FROZEN FOOD</div>
          <div className="text-center">{formatDate(new Date())}</div>
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

          <div className="my-1 border-t pt-1">
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
            className="px-4 py-1 rounded text-xs bg-blue-500 text-white"
          >
            PRINT
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded text-xs bg-gray-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}