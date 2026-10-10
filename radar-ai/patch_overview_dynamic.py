with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

import re

# 1. Remove mockTimelineData
content = re.sub(r'  const mockTimelineData = \[.*?  \];\n', '', content, flags=re.DOTALL)

# 2. Replace Chart data prop
content = content.replace('data={mockTimelineData}', 'data={data?.timeline_data || []}')

# 3. Replace Threat Level fallback text (threat_level -> risk_level in API)
content = content.replace("data.threat_level", "data.risk_level")

# 4. Replace hardcoded Raw Live Signals
hardcoded_signals = """              {[
                { status: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', text: 'Pricing page frequency increased (+12%)', time: '2h ago' },
                { status: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', text: 'New "Enterprise" feature tier launched on homepage', time: '12h ago' },
                { status: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]', text: 'Checkout flow updated to require work email', time: '1d ago' }
              ].map((sig, i) => ("""

dynamic_signals = """              {(!data?.raw_signals ? [] : data.raw_signals).map((sig: any, i: number) => {
                const statusColor = sig.urgency === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                  : sig.urgency === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                return ("""

content = content.replace(hardcoded_signals, dynamic_signals)
content = content.replace('className={"w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 " + sig.status}', 'className={"w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 " + statusColor}')

# 5. Replace hardcoded Recommended Actions
hardcoded_actions = """          <div className="space-y-6 flex-1">
            <div className="group">
              <span className="text-xs font-bold text-content text-xs uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-md tracking-wider uppercase inline-block mb-3 transition-colors group-hover:bg-violet-500/20">Pricing Strategy</span>
              <p className="text-sm text-muted leading-relaxed group-hover:text-content transition-colors">Review our mid-market tiers. The competitor's new enterprise feature may de-position our standard plan.</p>
            </div>
            <div className="group">
              <span className="text-xs font-bold text-content text-xs uppercase tracking-widest bg-blue-400/10 border border-brand-emerald/20 px-2.5 py-1 rounded-md tracking-wider uppercase inline-block mb-3 transition-colors group-hover:bg-blue-400/20">Sales Enablement</span>
              <p className="text-sm text-muted leading-relaxed group-hover:text-content transition-colors">Launch a comparison battlecard specifically targeting their missing SSO integration.</p>
            </div>
            <div className="group">
              <span className="text-xs font-bold text-content text-xs uppercase tracking-widest bg-blue-400/10 border border-brand-emerald/20 px-2.5 py-1 rounded-md tracking-wider uppercase inline-block mb-3 transition-colors group-hover:bg-blue-400/20">Sales Enablement</span>
              <p className="text-sm text-muted leading-relaxed group-hover:text-content transition-colors">Equip SDRs with objection handling for the competitor's new checkout flow changes.</p>
            </div>
          </div>"""

dynamic_actions = """          <div className="space-y-6 flex-1">
            {(!data?.recommended_actions ? [] : data.recommended_actions).map((act: any, i: number) => (
              <div key={i} className="group">
                <span className="text-xs font-bold text-content text-xs uppercase tracking-widest bg-brand-emerald/10 border border-brand-emerald/20 px-2.5 py-1 rounded-md tracking-wider uppercase inline-block mb-3 transition-colors group-hover:bg-brand-emerald/20">{act.tag}</span>
                <p className="text-sm text-muted leading-relaxed group-hover:text-content transition-colors">{act.text}</p>
              </div>
            ))}
            {(!data || !data.recommended_actions) && (
              <p className="text-sm text-muted">Run an analysis to generate actionable insights.</p>
            )}
          </div>"""

content = content.replace(hardcoded_actions, dynamic_actions)

with open('src/components/Overview.tsx', 'w') as f:
    f.write(content)

