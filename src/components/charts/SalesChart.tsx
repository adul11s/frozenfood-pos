import type { ChartDataPoint } from '../../services/report';

interface SalesChartProps {
  data: ChartDataPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full bg-blue-400 rounded-t relative"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">
              {d.value > 0 ? `${(d.value / 1000).toFixed(0)}K` : ''}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">{d.day}</span>
        </div>
      ))}
    </div>
  );
}