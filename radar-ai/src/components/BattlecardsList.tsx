import React from 'react';
import { FileText, Download, ExternalLink, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const BattlecardsList = () => {

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-8">
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-content tracking-tight">Battlecards</h2>
          <p className="text-muted text-sm mt-1 font-medium">AI-generated sales enablement materials to win competitive deals.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -4 }} className="bg-surface/80 backdrop-blur-xl border border-dashed border-line p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg transition-colors hover:border-line-hover hover:bg-surface/50">
          <div className="w-12 h-12 bg-input rounded-full flex items-center justify-center text-muted mb-3">
            <Zap size={20} />
          </div>
          <h3 className="text-content font-bold mb-1">Generate New</h3>
          <p className="text-muted text-sm max-w-[200px]">Select a competitor and topic to generate a new battlecard.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
