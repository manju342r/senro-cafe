import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TABS = [
  { to: '/staff/orders', label: 'Orders' },
  { to: '/staff/menu', label: 'Menu' },
  { to: '/staff/analytics', label: 'Profit' },
  { to: '/staff/ai', label: 'AI advice' },
];

export const StaffLayout: React.FC<{ active: string; children: React.ReactNode }> = ({
  active,
  children,
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-cream text-espresso">
      <header className="sticky top-0 z-10 border-b border-latte bg-espresso text-cream">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="font-display text-lg font-semibold">Senro Café · Staff</span>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Staff sections">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active === t.to ? 'page' : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  active === t.to ? 'bg-cream text-espresso' : 'text-cream/70 hover:text-cream'
                }`}
              >
                {t.label}
              </Link>
            ))}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/staff/login', { replace: true });
              }}
              className="ml-1 flex items-center gap-1 rounded-full border border-cream/30 px-3 py-1.5 text-sm"
            >
              <LogOut size={14} /> Out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-5">{children}</main>
    </div>
  );
};
