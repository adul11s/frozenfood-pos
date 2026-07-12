import { apiRequest } from './api';
import type { Product } from '../types';

export const getProducts = () => apiRequest<Product[]>('/products');

export const createProduct = (data: Omit<Product, 'id'>) =>
  apiRequest<{ success: boolean; id: string }>('/products/create', { body: { ...data } });

export const updateProduct = (id: string, data: Partial<Product>) =>
  apiRequest<{ success: boolean }>('/products/update', { body: { id, ...data } });

export const deleteProduct = (id: string) =>
  apiRequest<{ success: boolean }>('/products/delete', { body: { id } });