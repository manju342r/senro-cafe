import React from 'react';
import { Sparkles } from 'lucide-react';
import { StaffLayout } from '../../layouts/StaffLayout';
import { supabase } from '../../lib/supabase';
import { decideRecommendation, runAnalysis } from '../../lib/api';
import type { Recommendation } from '../../types';

export const AIPage: React.FC = () => {
  const [recs, setRecs] = React.useState<Recommendation[]>([]);
  const [running, setRunning] = React.useState(false);
  const [mode, setMode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const history = React.useCallback(async () => {
    const { data } = await supabase.from('recommendations')
      .select('id,type,title,description,status,created_at')
      .order('created_at', { ascending: false }).limit(20);
    setRecs((data ?? []) as Recommendation[]);
  }, []);

  React.useEffect(() => {
    history().catch(() => setError('History failed to load.'));
  }, [history]);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = (await runAnalysis(14)) as { mode: string };
      setMode(data.mode);
      await history();
    } catch (e) {
      setError(e instanceof Error ? `Analysis failed (${e.message}).` : 'Analysis failed.');
    } finally {
      setRunning(false);
    }
  };

  const decide = async (id: string, action: 'approved' | 'rejected' | 'implemented') => {
    try {
      await decideRecommendation(id, action);
      await history();
    } catch {
      setError('Decision failed to save.');
    }
  };

  return (
    <StaffLayout active="/staff/ai">
      <h1 className="flex items-center gap-2 font-display text-2xl font-semibold">
        <Sparkles size={22} className="text-ember" /> AI advice
      </h1>
      <p className="mt-1 text-sm text-cocoa">
        Reads live sales and delays, suggests one testable experiment at a time, remembers your calls.
        It never changes prices or orders by itself.
      </p>
      <button onClick={run} disabled={running}
        className="mt-4 rounded-full bg-ember px-5 py-2.5 text-sm font-bold text-cream disabled:opacity-50">
        {running ? 'Reading the books…' : 'Analyze the last 14 days'}
      </button>
      {mode && (
        <p className="mt-2 text-xs text-cocoa" aria-live="polite">
          {mode === 'llm' ? 'Narrative by AI over real numbers.' : 'Rule-based draft (no AI key set) — the numbers underneath are still live.'}
        </p>
      )}
      {error && <p className="mt-3 rounded-xl bg-card p-3 text-sm text-ember-deep shadow-sm" role="alert">{error}</p>}

      {recs.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-card p-6 text-center text-sm text-cocoa">No advice yet — run your first analysis above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recs.map((r) => (
            <li key={r.id} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{r.title}</p>
                  <p className="text-xs text-cocoa">{r.type} · {new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className="shrink-0 rounded-full bg-parchment px-3 py-1 text-xs font-bold">{r.status}</span>
              </div>
              <p className="mt-2 text-sm text-cocoa">{r.description}</p>
              {r.status === 'proposed' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => decide(r.id, 'approved')} className="rounded-full bg-espresso px-4 py-1.5 text-sm font-semibold text-cream">Approve</button>
                  <button onClick={() => decide(r.id, 'rejected')} className="rounded-full bg-parchment px-4 py-1.5 text-sm font-semibold">Reject</button>
                </div>
              )}
              {r.status === 'approved' && (
                <button onClick={() => decide(r.id, 'implemented')} className="mt-3 rounded-full bg-parchment px-4 py-1.5 text-sm font-semibold">
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
