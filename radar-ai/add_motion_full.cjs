const fs = require('fs');

const motion_imports = "import { motion } from 'framer-motion';\n";
const variants_code = `
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
`;

let code;

// LiveSignals
code = `import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const LiveSignals = () => {
  const [isConfigured, setIsConfigured] = React.useState(false);
  React.useEffect(() => {
    fetch('/api/config-status').then(res => res.json()).then(data => setIsConfigured(data.configured)).catch(() => {});
  }, []);
${variants_code}
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-8">
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Live signals</h2>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Real-time alerts triggered by competitor changes.</p>
        </div>
        {isConfigured ? (
          <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-sm font-medium">
            Scraping Active
          </div>
        ) : (
          <div className="bg-amber-500/10 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-lg text-sm font-medium">
            Scraping offline
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-24 text-center bg-[#121212]/30 backdrop-blur-sm transition-colors hover:border-zinc-700 hover:bg-[#121212]/50">
        <div className="w-16 h-16 bg-zinc-900/60 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
          <Activity size={32} className="text-zinc-700" />
        </div>
        <h3 className="text-zinc-300 font-medium mb-1">No signals recorded yet</h3>
        <p className="text-zinc-500 text-sm max-w-sm">
          Run a scan or wait for scheduled monitoring to detect changes in competitor pricing, messaging, or features.
        </p>
      </motion.div>
    </motion.div>
  );
};
`;
fs.writeFileSync('src/components/LiveSignals.tsx', code);

// CompareHub
code = `import React from 'react';
import { Search, ChevronDown, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const CompareHub = () => {
  const [compUrl, setCompUrl] = React.useState(() => localStorage.getItem('compUrl') || '');
  const [data] = React.useState<any>(() => {
    try { const stored = localStorage.getItem('overviewData'); return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const getDomain = (url: string) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url || 'No competitor'; } };
${variants_code}
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-8">
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Competitor matrix</h2>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Head-to-head comparison against your tracked competitors.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center bg-[#0a0a0a] gap-4">
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input type="text" placeholder="Search..." className="w-full sm:w-auto bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => alert("Initiating deep comparison matrix using Hindsight Context...")} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm">
            Compare
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0a0a] border-b border-white/5 text-zinc-500 font-medium tracking-wide">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded border-zinc-700 bg-zinc-900/60 backdrop-blur-md" /></th>
                <th className="p-4 uppercase text-xs tracking-wider">Competitor</th>
                <th className="p-4 uppercase text-xs tracking-wider">Category</th>
                <th className="p-4 uppercase text-xs tracking-wider">Pricing</th>
                <th className="p-4 uppercase text-xs tracking-wider">Sentiment</th>
                <th className="p-4 uppercase text-xs tracking-wider">Risk</th>
                <th className="p-4 uppercase text-xs tracking-wider">Last Scan</th>
                <th className="p-4 text-right uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {compUrl ? (
              <tr className="hover:bg-zinc-900/40 backdrop-blur-sm transition-colors group">
                <td className="p-4"><input type="checkbox" className="rounded border-zinc-700 bg-zinc-900/60 backdrop-blur-md" /></td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    {getDomain(compUrl)}
                    <a href={compUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} className="text-zinc-500 hover:text-blue-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" /></a>
                  </div>
                </td>
                <td className="p-4 text-zinc-400">Technology</td>
                <td className="p-4 text-zinc-400 capitalize">{data?.risk_level === "High" ? "Enterprise" : "Standard"}</td>
                <td className="p-4">
                  <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-[75%]"></div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={\`text-xs font-bold px-2 py-1 rounded-md \${data?.risk_level === "High" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}\`}>{data?.risk_level || "Medium"}</span>
                </td>
                <td className="p-4 text-zinc-500 font-medium">Just now</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-3 text-zinc-500">
                    <RefreshCw size={16} className="hover:text-zinc-300 cursor-pointer transition-colors" />
                    <Trash2 size={16} onClick={() => { if(window.confirm("Remove this competitor?")) { localStorage.removeItem("compUrl"); window.location.reload(); } }} className="hover:text-red-400 cursor-pointer transition-colors" />
                  </div>
                </td>
              </tr>
              ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">No competitors added yet.</td>
              </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
`;
fs.writeFileSync('src/components/CompareHub.tsx', code);

console.log("Rewrote components with Framer Motion!");
