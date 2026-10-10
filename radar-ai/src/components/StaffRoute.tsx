import React from 'react';
import { Navigate } from 'react-router-dom';
import { getSessionProfile, isStaffRole } from '../lib/supabase';

type State =
  | { kind: 'checking' }
  | { kind: 'denied'; message: string }
  | { kind: 'allowed' };

/** Blocks non-staff users. Customers never reach staff screens or cost data. */
export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<State>({ kind: 'checking' });

  React.useEffect(() => {
    let live = true;
    getSessionProfile()
      .then(({ user, profile }) => {
        if (!live) return;
        if (!user) {
          setState({ kind: 'denied', message: 'signed-out' });
        } else if (!profile) {
          setState({
            kind: 'denied',
            message: 'No staff profile found (migration 001 may not be applied yet).',
          });
        } else if (!isStaffRole(profile.role)) {
          setState({ kind: 'denied', message: `Role '${profile.role}' cannot access staff screens.` });
        } else {
          setState({ kind: 'allowed' });
        }
      })
      .catch(() =>
        setState({ kind: 'denied', message: 'Could not verify staff access. Check your connection.' })
      );
    return () => {
      live = false;
    };
  }, []);

  if (state.kind === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas text-sm text-muted" aria-live="polite">
        Verifying staff access…
      </div>
    );
  }
  if (state.kind === 'denied') {
    if (state.message === 'signed-out') return <Navigate to="/staff/login" replace />;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
        <div className="max-w-sm rounded-2xl border border-line bg-surface p-6 text-center" role="alert">
          <p className="text-sm">{state.message}</p>
          <a href="/staff/login" className="mt-4 inline-block text-sm underline">
            Go to staff login
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
