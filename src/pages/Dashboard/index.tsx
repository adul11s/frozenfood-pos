import { useQuery } from '@tanstack/react-query';
import { getSummary, getChartData } from '../../services/report';
import { formatRupiah } from '../../utils';
import SalesChart from '../../components/charts/SalesChart';
import { Card, PageHeader, Spinner } from '../../components/ui/Card';
import type { DashboardSummary, ChartDataPoint } from '../../types';

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
      <PageHeader title="Dashboard" />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card title="Modal" value={formatRupiah(s.capital)} color="text-blue-600" icon="🏦" />
            <Card title="Nilai Stock" value={formatRupiah(s.stockValue)} color="text-orange-600" icon="📦" />
            <Card title="Penjualan Hari Ini" value={formatRupiah(s.todaySales)} color="text-green-600" icon="💰" />
            <Card title="Profit Hari Ini" value={formatRupiah(s.todayProfit)} color="text-purple-600" icon="📈" />
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Grafik Penjualan 7 Hari</h2>
            {chartData && chartData.length > 0 ? (
              <SalesChart data={chartData} />
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">Belum ada data penjualan</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}