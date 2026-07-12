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
    queryFn: () =>
      getReport(
        filter,
        filter === 'custom' ? startDate : undefined,
        filter === 'custom' ? endDate : undefined,
      ),
    enabled: filter !== 'custom' || (!!startDate && !!endDate),
  });

  const card = (title: string, value: string, color: string) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100 text-sm">
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );

  const filters: { val: ReportFilter; label: string }[] = [
    { val: 'today', label: 'Hari Ini' },
    { val: 'week', label: 'Minggu' },
    { val: 'month', label: 'Bulan' },
    { val: 'custom', label: 'Custom' },
  ];

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Laporan" subtitle="Ringkasan penjualan dan keuangan" />

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
              filter === f.val ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {card('Omzet', formatRupiah(data.omzet), 'text-blue-600')}
            {card('Profit', formatRupiah(data.profit), 'text-green-600')}
            {card('Terlaris', data.produkTerlaris || '-', 'text-purple-600')}
            {card('Pengeluaran', formatRupiah(data.pengeluaran), 'text-red-500')}
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-sm">
            <h2 className="font-semibold text-gray-700 mb-2">Ringkasan</h2>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Total Modal</span>
                <span>{formatRupiah(data.modal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Nilai Stock</span>
                <span>{formatRupiah(data.stockValue)}</span>
              </div>
            </div>
          </div>
        </>
      ) : filter === 'custom' && (!startDate || !endDate) ? (
        <p className="text-center text-gray-400 py-8 text-sm">Pilih rentang tanggal</p>
      ) : null}
    </div>
  );
}