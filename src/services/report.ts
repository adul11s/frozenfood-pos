import { apiRequest } from './api';

export type ReportFilter = 'today' | 'week' | 'month' | 'custom';

export interface ReportData {
  omzet: number;
  profit: number;
  pengeluaran: number;
  modal: number;
  produkTerlaris: string;
  stockValue: number;
}

export interface ChartDataPoint {
  day: string;
  value: number;
}

export const getReport = (filter: ReportFilter, startDate?: string, endDate?: string) =>
  apiRequest<ReportData>('/report', {
    body: startDate ? { filter, startDate, endDate } : { filter },
  });

export const getChartData = (days = 7) => apiRequest<ChartDataPoint[]>('/chart', { body: { days } });

export const getSummary = () =>
  apiRequest<{ capital: number; stockValue: number; todaySales: number; todayProfit: number }>('/summary');