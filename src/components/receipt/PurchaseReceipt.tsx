import { formatRupiah, formatDateTime } from '../../utils';

interface PurchaseReceiptProps {
  purchase: {
    no: string;
    supplier: string;
    tanggal: string | Date;
    produk: string;
    qty: number;
    modal: number;
  };
  size?: '58mm' | '80mm';
  onClose: () => void;
}

export default function PurchaseReceipt({
  purchase,
  size = '58mm',
  onClose,
}: PurchaseReceiptProps) {
  const total = purchase.qty * purchase.modal;

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
          <div className="text-center">NOTA PEMBELIAN</div>
          <div className="text-center my-1">{'-'.repeat(32)}</div>

          <div className="flex justify-between">
            <span>No</span>
            <span>{purchase.no}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal</span>
            <span>{formatDateTime(purchase.tanggal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Supplier</span>
            <span>{purchase.supplier}</span>
          </div>
          <div className="text-center my-1">{'-'.repeat(32)}</div>

          <div className="mt-1">
            <div className="flex justify-between">
              <span>{purchase.produk}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>
                {purchase.qty} x {formatRupiah(purchase.modal)}
              </span>
              <span>{formatRupiah(total)}</span>
            </div>
          </div>

          <div className="my-1 border-t pt-1" style={{ borderColor: '#b9c9d4' }}>
            <div className="flex justify-between font-bold">
              <span>TOTAL MODAL</span>
              <span>{formatRupiah(total)}</span>
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