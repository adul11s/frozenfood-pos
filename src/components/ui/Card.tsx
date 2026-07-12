import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: string;
  color?: string;
  icon?: string;
  children?: ReactNode;
}

export function Card({ title, value, color = 'text-gray-800', icon, children }: CardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

export function Spinner({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-center text-gray-400 py-6 text-sm">{message}</p>;
}