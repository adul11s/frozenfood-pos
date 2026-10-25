import { apiRequest } from './api';
import type { Product, PaginatedResponse } from '../types';

export const getProducts = () => apiRequest<Product[]>('/products');

export const getProductsPage = (page: number, limit = 20) =>
  apiRequest<PaginatedResponse<Product>>('/products', { body: { page, limit } });

export const createProduct = (data: Omit<Product, 'id'>) =>
  apiRequest<{ success: boolean; id: string }>('/products/create', { body: { ...data } });

export const updateProduct = (id: string, data: Partial<Product>) =>
  apiRequest<{ success: boolean }>('/products/update', { body: { id, ...data } });

export const deleteProduct = (id: string) =>
  apiRequest<{ success: boolean }>('/products/delete', { body: { id } });