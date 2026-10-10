import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const LiveSignals = () => {
  const [isConfigured, setIsConfigured] = React.useState(false);
  React.useEffect(() => {
    fetch('/api/config-status').then(res => res.json()).then(data => setIsConfigured(data.configured)).catch(() => {});
  }, []);

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
          <h2 className="text-3xl font-extrabold text-content tracking-tight">Live signals</h2>
          <p className="text-muted text-sm mt-1 font-medium">Real-time alerts triggered by competitor changes.</p>
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

      <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="border border-dashed border-line rounded-2xl flex flex-col items-center justify-center p-24 text-center bg-surface/30 backdrop-blur-sm transition-colors hover:border-line-hover hover:bg-surface/50">
        <div className="w-16 h-16 bg-surface/60  rounded-full flex items-center justify-center mb-4">
          <Activity size={32} className="text-muted" />
        </div>
        <h3 className="text-content font-medium mb-1">No signals recorded yet</h3>
        <p className="text-muted text-sm max-w-sm">
          Run a scan or wait for scheduled monitoring to detect changes in competitor pricing, messaging, or features.
        </p>
      </motion.div>
    </motion.div>
  );
};
