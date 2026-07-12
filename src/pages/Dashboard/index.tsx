import { useQuery } from '@tanstack/react-query';
import { getSummary, getChartData } from '../../services/report';
import { formatRupiah } from '../../utils';
import SalesChart from '../../components/charts/SalesChart';
import { Spinner } from '../../components/ui/Card';
import type { DashboardSummary, ChartDataPoint } from '../../types';

const cards = [
  { key: 'capital', label: 'Modal', color: 'text-ice', icon: '🏦' },
  { key: 'stockValue', label: 'Nilai Stock', color: 'text-tangerine', icon: '📦' },
  { key: 'todaySales', label: 'Penjualan Hari Ini', color: 'text-mint', icon: '💰' },
  { key: 'todayProfit', label: 'Profit Hari Ini', color: 'text-amber', icon: '📈' },
] as const;

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: getSummary,
    refetchInterval: 30000,
  });

  const { data: chartData } = useQuery<ChartDataPoint[]>({
    queryKey: ['chart'],
    queryFn: () => getChartData(7),
    refetchInterval: 30000,
  });

  const s = data || { capital: 0, stockValue: 0, todaySales: 0, todayProfit: 0 };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold font-display text-frost">Dashboard</h1>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.key} className="panel p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-frost-dim uppercase tracking-wide">{c.label}</p>
                  <span className="text-lg">{c.icon}</span>
                </div>
                <p className={`text-xl font-bold mt-1 ${c.color} font-mono`}>
                  {formatRupiah(s[c.key])}
                </p>
              </div>
            ))}
          </div>

          <div className="panel p-5">
            <h2 className="text-sm font-semibold text-frost-dim mb-3">Grafik Penjualan 7 Hari</h2>
            {chartData && chartData.length > 0 ? (
              <SalesChart data={chartData} />
            ) : (
              <p className="text-center text-frost-dim text-sm py-8">Belum ada data penjualan</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}