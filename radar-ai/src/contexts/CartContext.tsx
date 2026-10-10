import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { MenuItem } from '../types';

export interface CartLine {
  menu_item_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  note: string;
  available: boolean;
}

interface Cart {
  lines: CartLine[];
  count: number;
  total: number;
  add: (item: MenuItem, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  setNote: (id: string, note: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  refresh: (live: MenuItem[]) => void;
}

const Ctx = createContext<Cart | undefined>(undefined);
const KEY = 'senro-cart-v1';

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* private mode etc: cart still works for the session */
    }
  }, [lines]);

  const value = useMemo<Cart>(() => {
    const add: Cart['add'] = (item, qty = 1) =>
      setLines((prev) => {
        const hit = prev.find((l) => l.menu_item_id === item.id);
        if (hit) {
          return prev.map((l) =>
            l.menu_item_id === item.id ? { ...l, quantity: Math.min(20, l.quantity + qty) } : l
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
            available: item.is_available,
          },
        ];
      });
    const setQty: Cart['setQty'] = (id, qty) =>
      setLines((prev) =>
        qty <= 0
          ? prev.filter((l) => l.menu_item_id !== id)
          : prev.map((l) => (l.menu_item_id === id ? { ...l, quantity: Math.min(20, qty) } : l))
      );
    const setNote: Cart['setNote'] = (id, note) =>
      setLines((prev) => prev.map((l) => (l.menu_item_id === id ? { ...l, note } : l)));
    const remove: Cart['remove'] = (id) => setLines((prev) => prev.filter((l) => l.menu_item_id !== id));
    const clear = () => setLines([]);
    const refresh: Cart['refresh'] = (live) => {
      const map = new Map(live.map((i) => [i.id, i]));
      setLines((prev) =>
        prev.map((l) => {
          const item = map.get(l.menu_item_id);
          if (!item) return { ...l, available: false };
          return { ...l, name: item.name, unit_price_cents: item.price_cents, available: item.is_available };
        })
      );
    };
    return {
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      total: lines.reduce((n, l) => n + l.quantity * l.unit_price_cents, 0),
      add,
      setQty,
      setNote,
      remove,
      clear,
      refresh,
    };
  }, [lines]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useCart(): Cart {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
