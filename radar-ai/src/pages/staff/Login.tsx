import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, sessionProfile } from '../../lib/supabase';

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
      if (signErr) throw new Error('Wrong email or password.');
      const { role } = await sessionProfile();
      if (role !== 'staff' && role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Not a staff account. Ask an admin to upgrade your role.');
      }
      navigate('/staff/orders', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-card p-7 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Staff sign in</h1>
        <p className="mt-1 text-sm text-cocoa">Senro Café operations.</p>
        <label className="mt-5 block text-sm font-semibold" htmlFor="s-email">Email</label>
        <input id="s-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          className="mt-1 w-full rounded-xl bg-cream px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ember/40" />
        <label className="mt-3 block text-sm font-semibold" htmlFor="s-pass">Password</label>
        <input id="s-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl bg-cream px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ember/40" />
        {error && <p className="mt-3 rounded-xl bg-parchment p-3 text-sm text-ember-deep" role="alert">{error}</p>}
        <button type="submit" disabled={busy}
          className="mt-4 w-full rounded-full bg-espresso py-3 text-sm font-bold text-cream disabled:opacity-50">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};
