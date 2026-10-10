import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getSessionProfile, isStaffRole } from '../../lib/supabase';

export const StaffLoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) throw new Error('Invalid email or password.');
      const { profile } = await getSessionProfile();
      if (!profile || !isStaffRole(profile.role)) {
        await supabase.auth.signOut();
        throw new Error('This account is not staff. Contact an admin to upgrade your role.');
      }
      navigate('/staff/orders', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-content">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6"
      >
        <h1 className="text-xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-1 text-sm text-muted">Senro Café operations dashboard.</p>
        <label className="mt-4 block text-sm font-medium" htmlFor="staff-email">Email</label>
        <input
          id="staff-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          className="mt-1 w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm outline-none"
        />
        <label className="mt-3 block text-sm font-medium" htmlFor="staff-pass">Password</label>
        <input
          id="staff-pass"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm outline-none"
        />
        {error && (
          <p className="mt-3 rounded-xl bg-surface-elevated p-3 text-sm" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-full bg-content py-3 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};
