import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReport, type ReportFilter } from '../../services/report';
import { formatRupiah } from '../../utils';
import { PageHeader, Spinner } from '../../components/ui/Card';
import type { ReportData } from '../../types';

export default function Report() {
  const [filter, setFilter] = useState<ReportFilter>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['report', filter, startDate, endDate],
    queryFn: () => getReport(filter, filter === 'custom' ? startDate : undefined, filter === 'custom' ? endDate : undefined),
    enabled: filter !== 'custom' || (!!startDate && !!endDate),
  });

  const card = (title: string, value: string, color: string) => (
    <div className="panel p-4 text-sm">
      <p className="text-xs text-frost-dim uppercase">{title}</p>
      <p className={`text-lg font-bold mt-1 font-mono ${color}`}>{value}</p>
    </div>
  );

  const filters: { val: ReportFilter; label: string }[] = [
    { val: 'today', label: 'Hari Ini' }, { val: 'week', label: 'Minggu' }, { val: 'month', label: 'Bulan' }, { val: 'custom', label: 'Custom' },
  ];

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Laporan" subtitle="Ringkasan penjualan dan keuangan" />

      <div className="flex gap-2">
        {filters.map((f) => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold ${filter === f.val ? 'bg-gradient-to-r from-ice to-ice-dim text-bg-deep' : 'panel-2 text-frost-dim'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="panel p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-frost-dim">Dari</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full panel-2 px-3 py-2 text-frost outline-none" />
            </div>
            <div>
              <label className="text-xs text-frost-dim">Sampai</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full panel-2 px-3 py-2 text-frost outline-none" />
            </div>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {card('Omzet', formatRupiah(data.omzet), 'text-ice')}
            {card('Profit', formatRupiah(data.profit), 'text-mint')}
            {card('Terlaris', data.produkTerlaris || '-', 'text-tangerine')}
            {card('Pengeluaran', formatRupiah(data.pengeluaran), 'text-alert')}
          </div>
          <div className="panel p-4 text-sm">
            <h2 className="font-semibold text-frost-dim mb-2">Ringkasan</h2>
            <div className="space-y-1 text-xs text-frost-dim">
              <div className="flex justify-between"><span>Total Modal</span><span className="font-mono">{formatRupiah(data.modal)}</span></div>
              <div className="flex justify-between"><span>Nilai Stock</span><span className="font-mono">{formatRupiah(data.stockValue)}</span></div>
            </div>
          </div>
        </>
      ) : filter === 'custom' && (!startDate || !endDate) ? (
        <p className="text-center text-frost-dim py-8 text-sm">Pilih rentang tanggal</p>
      ) : null}
    </div>
  );
}