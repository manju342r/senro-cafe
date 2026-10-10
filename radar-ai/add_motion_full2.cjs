const fs = require('fs');
const variants_code = `
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
`;

// BattlecardsList
let code = `import React from 'react';
import { FileText, Download, ExternalLink, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const BattlecardsList = () => {
${variants_code}
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-8">
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Battlecards</h2>
          <p className="text-zinc-500 text-sm mt-1 font-medium">AI-generated sales enablement materials to win competitive deals.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -4 }} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 p-6 rounded-2xl flex flex-col justify-between shadow-lg transition-colors group">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Pricing Objection</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-blue-400 transition-colors">Enterprise Tier Objection Handling</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">Generated 2 days ago after competitor updated their standard pricing model to obscure enterprise limits.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 py-2 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2">
              <Download size={16} /> Export PDF
            </button>
          </div>
        </motion.div>
        
        <motion.div whileHover={{ y: -4 }} className="bg-[#121212]/80 backdrop-blur-xl border border-dashed border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg transition-colors hover:border-zinc-700 hover:bg-[#121212]/50">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-zinc-500 mb-3">
            <Zap size={20} />
          </div>
          <h3 className="text-zinc-300 font-bold mb-1">Generate New</h3>
          <p className="text-zinc-500 text-sm max-w-[200px]">Select a competitor and topic to generate a new battlecard.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
`;
fs.writeFileSync('src/components/BattlecardsList.tsx', code);

// SettingsUI
code = `import React from 'react';
import { Save, Key } from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsUI = () => {
${variants_code}
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Settings</h2>
        <p className="text-zinc-500 text-sm mt-1 font-medium">Manage your workspace configuration and integrations.</p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2"><Key size={18} className="text-blue-500" /> API Keys</h3>
          <p className="text-zinc-400 text-sm mt-1">Configure your LLM and scraping integrations.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Vectorize Key (Hindsight)</label>
              <input type="password" placeholder="sk-..." className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Jina AI Key</label>
              <input type="password" placeholder="jina-..." className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={() => alert("Settings saved.")} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 flex items-center gap-2 transform hover:-translate-y-0.5">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
`;
fs.writeFileSync('src/components/SettingsUI.tsx', code);

// Profile
code = `import React from 'react';
import { User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';

export const Profile = () => {
  const email = localStorage.getItem('userEmail') || 'F';
  const { supabase } = useData();
${variants_code}
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-3xl mx-auto space-y-8 pb-12">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Your Profile</h2>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg p-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-4xl mb-4 shadow-xl">
          {email.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-xl font-bold text-zinc-100">{email}</h3>
        <p className="text-zinc-500 text-sm mt-1 mb-8">Senro.AI Administrator</p>
        
        <button onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem('userEmail'); window.location.href = '/login'; }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
          <LogOut size={16} /> Sign out of Senro.AI
        </button>
      </motion.div>
    </motion.div>
  );
};
`;
fs.writeFileSync('src/components/Profile.tsx', code);

console.log("Rewrote remaining components with Framer Motion!");
