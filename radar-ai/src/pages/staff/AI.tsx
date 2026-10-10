import React from 'react';
import { StaffLayout } from '../../layouts/StaffLayout';
import { supabase } from '../../lib/supabase';

interface Rec {
  id: string;
  type: string;
  title: string;
  description: string;
  metrics: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

export const AIPage: React.FC = () => {
  const [recs, setRecs] = React.useState<Rec[]>([]);
  const [running, setRunning] = React.useState(false);
  const [mode, setMode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const headers = async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  };

  const loadHistory = React.useCallback(async () => {
    const { data } = await supabase
      .from('recommendations')
      .select('id, type, title, description, metrics, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setRecs((data ?? []) as Rec[]);
  }, []);

  React.useEffect(() => {
    loadHistory().catch(() => setError('Could not load recommendation history.'));
  }, [loadHistory]);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: await headers(),
        body: JSON.stringify({ days: 14 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'analysis_failed');
      setMode(data.mode);
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? `Analysis failed: ${e.message}` : 'Analysis failed.');
    } finally {
      setRunning(false);
    }
  };

  const decide = async (id: string, action: 'approved' | 'rejected' | 'implemented') => {
    try {
      const res = await fetch('/api/ai-approve', {
        method: 'POST',
        headers: await headers(),
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error('decision_failed');
      await loadHistory();
    } catch {
      setError('Could not record the decision.');
    }
  };

  return (
    <StaffLayout active="/staff/ai">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">AI intelligence</h1>
      <p className="mb-4 text-sm text-muted">
        Reads live sales + delay data, proposes measurable experiments, remembers decisions.
        Nothing changes prices or orders without your approval.
      </p>

      <button
        onClick={run}
        disabled={running}
        className="mb-2 rounded-full bg-content px-5 py-2.5 text-sm font-medium text-canvas disabled:opacity-50"
      >
        {running ? 'Analyzing live data…' : 'Run analysis (14 days)'}
      </button>
      {mode && (
        <p className="mb-4 text-xs text-muted" aria-live="polite">
          Last run: {mode === 'llm' ? 'LLM-assisted narrative over real stats.' : 'Rule-based draft (no LLM key configured). Stats are real either way.'}
        </p>
      )}
      {error && <p className="mb-3 rounded-xl border border-line bg-surface p-3 text-sm" role="alert">{error}</p>}

      {recs.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-muted">No recommendations yet. Run the first analysis above.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recs.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {r.type} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium">
                  {r.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{r.description}</p>
              {r.status === 'proposed' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => decide(r.id, 'approved')}
                    className="rounded-full bg-content px-4 py-1.5 text-sm font-medium text-canvas"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(r.id, 'rejected')}
                    className="rounded-full border border-line px-4 py-1.5 text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
              {r.status === 'approved' && (
                <button
                  onClick={() => decide(r.id, 'implemented')}
                  className="mt-3 rounded-full border border-line px-4 py-1.5 text-sm"
                >
                  Mark implemented
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </StaffLayout>
  );
};
