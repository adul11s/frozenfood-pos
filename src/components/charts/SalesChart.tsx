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
            className="w-full rounded-t relative transition-all"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              background: d.value > 0
                ? 'linear-gradient(180deg, var(--color-ice), var(--color-ice-dim))'
                : 'rgba(125,232,240,0.08)',
            }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-frost-dim whitespace-nowrap font-mono">
              {d.value > 0 ? `${(d.value / 1000).toFixed(0)}K` : ''}
            </span>
          </div>
          <span className="text-[10px] text-frost-dim">{d.day}</span>
        </div>
      ))}
    </div>
  );
}