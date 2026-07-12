import { apiRequest } from './api';
import type { Supplier } from '../types';

export const getSuppliers = () => apiRequest<Supplier[]>('/suppliers');

export const createSupplier = (data: Omit<Supplier, 'id'>) =>
  apiRequest<{ success: boolean; id: string }>('/supplier/create', { body: { ...data } });

export const updateSupplier = (id: string, data: Partial<Supplier>) =>
  apiRequest<{ success: boolean }>('/supplier/update', { body: { id, ...data } });

export const deleteSupplier = (id: string) =>
  apiRequest<{ success: boolean }>('/supplier/delete', { body: { id } });