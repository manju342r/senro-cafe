with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

import re

# We will just replace everything from `className="bg-surface/80 backdrop-blur-xl/90  border border-line/80 p-6 sm:p-8 rounded-2xl shadow-lg flex-1">`
# to `<motion.div variants={itemVariants} className="lg:col-span-2 bg-surface/80 backdrop-blur-xl/90  border border-line/80 p-6 sm:p-8 rounded-2xl flex flex-col shadow-lg">`

pattern = r'<motion\.div variants=\{itemVariants\} className="bg-surface/80 backdrop-blur-xl/90  border border-line/80 p-6 sm:p-8 rounded-2xl shadow-lg flex-1">.*?{/\* RIGHT COLUMN \(40%\) \*/}'

replacement = """<motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl/90 border border-line/80 p-6 sm:p-8 rounded-2xl shadow-lg flex-1">
            <h3 className="text-sm font-bold text-content mb-6 uppercase tracking-widest">Raw Live Signals</h3>
            <div className="space-y-4">
              {(!data?.raw_signals ? [] : data.raw_signals).map((sig: any, i: number) => {
                const statusColor = sig.urgency === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                  : sig.urgency === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  key={i} 
                  className="flex items-start justify-between gap-4 border-b border-line/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className={"w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 " + statusColor}></div>
                    <p className="text-sm text-content leading-snug font-medium">{sig.text}</p>
                  </div>
                  <span className="text-xs text-muted font-medium flex-shrink-0">{sig.time}</span>
                </motion.div>
                );
              })}
              {(!data || !data.raw_signals) && <p className="text-sm text-muted">No recent signals detected.</p>}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN (40%) */}"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/Overview.tsx', 'w') as f:
    f.write(new_content)

