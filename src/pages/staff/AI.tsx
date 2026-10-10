import { useState } from 'react'
import { analyzeStaffPrompt, type InsightResult } from '@/lib/aiInsight'
import { useDemoState } from '@/hooks/useDemo'

const PRESETS = [
  "What's our worst margin item during lunch?",
  'How is the rush / queue looking?',
  "What's driving contribution today?",
]

export function StaffAIPage() {
  useDemoState()
  const [prompt, setPrompt] = useState(PRESETS[0])
  const [result, setResult] = useState<InsightResult | null>(null)

  function run(nextPrompt?: string) {
    const p = nextPrompt ?? prompt
    setPrompt(p)
    setResult(analyzeStaffPrompt(p))
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="type-page text-leaf">Floor intelligence</h1>
      <p className="mt-2 text-steam">
        Evidence-backed tips from live demo data (allowlisted tools — no raw SQL from a model).
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => run(p)}
            className="chip chip-idle text-left"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        className="mt-6 border border-line bg-forest/40 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
      >
        <label htmlFor="ai-prompt" className="text-sm font-medium text-steam">
          Ask the floor
        </label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="field mt-2"
        />
        <button type="submit" className="btn btn-primary mt-4">
          Analyze
        </button>
      </form>

      {!result && (
        <p className="mt-8 text-steam">Run a preset or ask about margins / rush.</p>
      )}

      {result && (
        <article className="mt-8 border border-line bg-forest/40 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="type-section text-foam">{result.title}</h2>
            <span className="rounded-md bg-leaf/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-leaf">
              {result.confidence} confidence
            </span>
          </div>
          <p className="mt-4 leading-relaxed text-steam">{result.answer}</p>

          <h3 className="eyebrow mt-6">Evidence</h3>
          <ul className="mt-2 space-y-2">
            {result.evidence.map((ev) => (
              <li key={ev.id} className="rounded-md border border-line/80 px-3 py-2 text-sm">
                <span className="text-leaf">{ev.source}</span>
                <span className="text-steam"> — {ev.summary}</span>
              </li>
            ))}
          </ul>

          <h3 className="eyebrow mt-6">Metrics</h3>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(result.metrics).map(([k, v]) => (
              <div key={k} className="rounded-md border border-line/60 px-3 py-2 text-sm">
                <dt className="text-steam">{k}</dt>
                <dd className="font-semibold text-foam">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </article>
      )}
    </main>
  )
}
