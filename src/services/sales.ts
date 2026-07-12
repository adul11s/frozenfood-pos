import { apiRequest } from './api';
import type { SaleDetail } from '../types';

export interface SalePayload {
  invoice: string;
  tanggal: string;
  kasir: string;
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembali: number;
  metode: string;
  details: SaleDetail[];
}

export const createSale = (data: SalePayload) =>
  apiRequest<{ success: boolean; invoice: string; profit: number }>('/sales', {
    body: { ...data },
  });