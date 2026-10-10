import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export const CustomerLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => {
  const { count } = useCart();
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-canvas text-content">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/menu')}
            className="text-left text-lg font-semibold tracking-tight"
            aria-label="Senro Café home"
          >
            Senro Café
          </button>
          <Link
            to="/cart"
            className="relative rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium"
            aria-label={`Cart, ${count} items`}
          >
            Cart
            {count > 0 && (
              <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-content px-1.5 text-xs text-canvas">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        {title && <h1 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h1>}
        {children}
      </main>
    </div>
  );
};
