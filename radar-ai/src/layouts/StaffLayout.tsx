import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const TABS = [
  { to: '/staff/orders', label: 'Orders' },
  { to: '/staff/menu', label: 'Menu' },
  { to: '/staff/analytics', label: 'Analytics' },
  { to: '/staff/ai', label: 'AI' },
];

export const StaffLayout: React.FC<{ children: React.ReactNode; active: string }> = ({
  children,
  active,
}) => {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/staff/login', { replace: true });
  };
  return (
    <div className="min-h-dvh bg-canvas text-content">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <span className="font-semibold tracking-tight">Senro Café · Staff</span>
          <nav className="flex items-center gap-1" aria-label="Staff sections">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active === t.to ? 'page' : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  active === t.to ? 'bg-content text-canvas' : 'text-muted hover:text-content'
                }`}
              >
                {t.label}
              </Link>
            ))}
            <button onClick={signOut} className="ml-1 rounded-full border border-line px-3 py-1.5 text-sm">
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-5">{children}</main>
    </div>
  );
};
