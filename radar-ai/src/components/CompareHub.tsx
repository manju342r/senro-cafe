import React from 'react';
import { Search, ChevronDown, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const CompareHub = () => {
  const [compUrl, setCompUrl] = React.useState(() => localStorage.getItem('compUrl') || '');
  const [data] = React.useState<any>(() => {
    try { const stored = localStorage.getItem('overviewData'); return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const getDomain = (url: string) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url || 'No competitor'; } };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-8">
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-content tracking-tight">Competitor matrix</h2>
          <p className="text-muted text-sm mt-1 font-medium">Head-to-head comparison against your tracked competitors.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl border border-line rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row justify-between items-center bg-canvas gap-4">
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Search..." className="w-full sm:w-auto bg-surface/60  border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-content focus:outline-none focus:border-content transition-colors" />
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => alert("Initiating deep comparison matrix using Hindsight Context...")} className="w-full sm:w-auto bg-brand-emerald hover:bg-brand-dark text-inverted text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm">
            Compare
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas border-b border-line text-muted font-medium tracking-wide">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded border-line-hover bg-surface/60 " /></th>
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
              <tr className="hover:bg-surface/40 backdrop-blur-sm transition-colors group">
                <td className="p-4"><input type="checkbox" className="rounded border-line-hover bg-surface/60 " /></td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-content font-medium">
                    {getDomain(compUrl)}
                    <a href={compUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} className="text-muted hover:text-brand-mint cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" /></a>
                  </div>
                </td>
                <td className="p-4 text-muted">{data?.category || "Unknown"}</td>
                <td className="p-4 text-muted capitalize">{data?.risk_level === "High" ? "Enterprise" : "Standard"}</td>
                <td className="p-4">
                  <div className="w-24 h-2 bg-surface-hover rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${data?.sentiment_score || 50}%` }}></div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${data?.risk_level === "High" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>{data?.risk_level || "Medium"}</span>
                </td>
                <td className="p-4 text-muted font-medium">Just now</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-3 text-muted">
                    <RefreshCw size={16} className="hover:text-content cursor-pointer transition-colors" />
                    <Trash2 size={16} onClick={() => { if(window.confirm("Remove this competitor?")) { localStorage.removeItem("compUrl"); window.location.reload(); } }} className="hover:text-red-400 cursor-pointer transition-colors" />
                  </div>
                </td>
              </tr>
              ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted">No competitors added yet.</td>
              </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
