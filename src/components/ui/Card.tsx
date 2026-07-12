import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: string;
  color?: string;
  icon?: string;
  children?: ReactNode;
}

export function Card({ title, value, color = 'text-frost', icon, children }: CardProps) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-frost-dim uppercase tracking-wide">{title}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-xl font-bold mt-1 ${color} font-mono`}>{value}</p>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold font-display text-frost">{title}</h1>
      {subtitle && <p className="text-xs text-frost-dim">{subtitle}</p>}
    </div>
  );
}

export function Spinner({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <div className="animate-spin w-8 h-8 border-4 border-ice border-t-transparent rounded-full" />
      <p className="text-frost-dim text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-center text-frost-dim py-6 text-sm">{message}</p>;
}