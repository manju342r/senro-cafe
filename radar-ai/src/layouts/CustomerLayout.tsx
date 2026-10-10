import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { count } = useCart();
  return (
    <div className="min-h-dvh bg-cream text-espresso">
      <header className="sticky top-0 z-10 border-b border-latte bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/menu" className="font-display text-2xl font-semibold tracking-tight">
            Senro <span className="text-ember">Café</span>
          </Link>
          <Link
            to="/cart"
            aria-label={`Basket, ${count} items`}
            className="relative flex items-center gap-2 rounded-full bg-espresso px-4 py-2 text-sm font-semibold text-cream"
          >
            <ShoppingBag size={16} />
            Basket
            {count > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-ember px-1 text-xs">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">{children}</main>
    </div>
  );
};
