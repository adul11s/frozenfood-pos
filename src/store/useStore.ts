import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CartItem, Product } from '../types';
import { getHarga } from '../utils';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, qty: number) => void;
  removeFromCart: (barcode: string) => void;
  updateCartQty: (barcode: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; modal: number; profit: number };
  isOnline: boolean;
  setOnline: (v: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      cart: [],
      addToCart: (product, qty) => {
        const harga = getHarga(product, qty);
        const existing = get().cart.find((c) => c.barcode === product.barcode);
        if (existing) {
          set((state) => ({
            cart: state.cart.map((c) =>
              c.barcode === product.barcode
                ? { ...c, qty: c.qty + qty, subtotal: (c.qty + qty) * harga, harga }
                : c,
            ),
          }));
        } else {
          set((state) => ({
            cart: [
              ...state.cart,
              { ...product, qty, harga, subtotal: qty * harga, modal: product.modal * qty },
            ],
          }));
        }
      },
      removeFromCart: (barcode) =>
        set((s) => ({ cart: s.cart.filter((c) => c.barcode !== barcode) })),
      updateCartQty: (barcode, qty) => {
        if (qty <= 0) {
          get().removeFromCart(barcode);
          return;
        }
        const item = get().cart.find((c) => c.barcode === barcode);
        if (!item) return;
        const harga = getHarga(item, qty);
        set((state) => ({
          cart: state.cart.map((c) =>
            c.barcode === barcode ? { ...c, qty, subtotal: qty * harga, harga } : c,
          ),
        }));
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        const cart = get().cart;
        const subtotal = cart.reduce((sum, c) => sum + c.subtotal, 0);
        const modal = cart.reduce((sum, c) => sum + c.modal, 0);
        return { subtotal, modal, profit: subtotal - modal };
      },
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setOnline: (v) => set({ isOnline: v }),
    }),
    { name: 'frozenpos-store' },
  ),
);