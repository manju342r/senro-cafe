import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { MenuItem } from '../types/database';

export interface CartLine {
  menu_item_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  note: string;
  is_available: boolean;
}

interface CartContextType {
  lines: CartLine[];
  count: number;
  totalCents: number;
  addItem: (item: MenuItem, qty?: number) => void;
  setQty: (menu_item_id: string, qty: number) => void;
  setNote: (menu_item_id: string, note: string) => void;
  removeLine: (menu_item_id: string) => void;
  clear: () => void;
  syncAvailability: (liveItems: MenuItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'cafeos-cart-v1';

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage full/blocked: cart still works in memory */
    }
  }, [lines]);

  const value = useMemo<CartContextType>(() => {
    const addItem: CartContextType['addItem'] = (item, qty = 1) => {
      setLines((prev) => {
        const found = prev.find((l) => l.menu_item_id === item.id);
        if (found) {
          return prev.map((l) =>
            l.menu_item_id === item.id
              ? { ...l, quantity: Math.min(20, l.quantity + qty) }
              : l
          );
        }
        return [
          ...prev,
          {
            menu_item_id: item.id,
            name: item.name,
            unit_price_cents: item.price_cents,
            quantity: Math.min(20, qty),
            note: '',
            is_available: item.is_available,
          },
        ];
      });
    };
    const setQty: CartContextType['setQty'] = (menu_item_id, qty) => {
      setLines((prev) =>
        qty <= 0
          ? prev.filter((l) => l.menu_item_id !== menu_item_id)
          : prev.map((l) =>
              l.menu_item_id === menu_item_id
                ? { ...l, quantity: Math.min(20, qty) }
                : l
            )
      );
    };
    const setNote: CartContextType['setNote'] = (menu_item_id, note) => {
      setLines((prev) =>
        prev.map((l) => (l.menu_item_id === menu_item_id ? { ...l, note } : l))
      );
    };
    const removeLine: CartContextType['removeLine'] = (menu_item_id) => {
      setLines((prev) => prev.filter((l) => l.menu_item_id !== menu_item_id));
    };
    const clear = () => setLines([]);
    const syncAvailability: CartContextType['syncAvailability'] = (liveItems) => {
      const live = new Map(liveItems.map((i) => [i.id, i]));
      setLines((prev) =>
        prev.map((l) => {
          const hit = live.get(l.menu_item_id);
          if (!hit) return { ...l, is_available: false };
          return {
            ...l,
            name: hit.name,
            unit_price_cents: hit.price_cents,
            is_available: hit.is_available,
          };
        })
      );
    };
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const totalCents = lines.reduce((n, l) => n + l.quantity * l.unit_price_cents, 0);
    return { lines, count, totalCents, addItem, setQty, setNote, removeLine, clear, syncAvailability };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
