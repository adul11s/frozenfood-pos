import { apiRequest } from './api';

export interface StockEntry {
  barcode: string;
  qty: number;
  tanggal?: string;
  keterangan?: string;
}

export const stockIn = (data: StockEntry) =>
  apiRequest<{ success: boolean }>('/stock/in', { body: { ...data } });

export const stockOut = (data: StockEntry) =>
  apiRequest<{ success: boolean }>('/stock/out', { body: { ...data } });