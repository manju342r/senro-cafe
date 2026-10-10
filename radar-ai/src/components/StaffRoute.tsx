import React from 'react';
import { Navigate } from 'react-router-dom';
import { sessionProfile } from '../lib/supabase';

/** Only staff/admin pass. Everyone else gets login or a plain denial. */
export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<'checking' | 'deny-login' | { deny: string } | 'ok'>('checking');

  React.useEffect(() => {
    let live = true;
    sessionProfile()
      .then(({ userId, role }) => {
        if (!live) return;
        if (!userId) setState('deny-login');
        else if (role === 'staff' || role === 'admin') setState('ok');
        else
          setState({
            deny: role
              ? `Account role '${role}' cannot open staff screens.`
              : 'No staff profile yet — the database setup may be incomplete.',
          });
      })
      .catch(() => live && setState({ deny: 'Could not verify access. Check your connection.' }));
    return () => {
      live = false;
    };
  }, []);

  if (state === 'checking')
    return <p className="p-8 text-center text-cocoa" aria-live="polite">Checking staff access…</p>;
  if (state === 'deny-login') return <Navigate to="/staff/login" replace />;
  if (state !== 'ok')
    return (
      <div className="mx-auto mt-16 max-w-sm rounded-2xl bg-card p-6 text-center shadow-sm" role="alert">
        <p className="text-sm">{state.deny}</p>
        <a href="/staff/login" className="mt-3 inline-block text-sm font-medium text-ember underline">
          Staff login
        </a>
      </div>
    );
  return <>{children}</>;
};
