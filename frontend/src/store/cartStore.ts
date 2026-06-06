import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  listing_id: string;
  player_name: string;
  image_url?: string;
  price: number;
  seller_username: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (listing_id: string) => void;
  clear: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((s) => ({
        items: s.items.find(i => i.listing_id === item.listing_id) ? s.items : [...s.items, item]
      })),
      removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.listing_id !== id) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price, 0),
    }),
    { name: 'cardmatch-cart' }
  )
);
