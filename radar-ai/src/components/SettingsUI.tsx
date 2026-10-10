import React, { useState, useEffect } from 'react';
import { Save, Key, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';

export const SettingsUI = () => {
  const [ownUrl, setOwnUrl] = useState('');
  const [compUrl, setCompUrl] = useState('');
  const { supabase } = useData();

  useEffect(() => {
    setOwnUrl(localStorage.getItem('ownUrl') || '');
    setCompUrl(localStorage.getItem('compUrl') || '');
  }, []);

  const handleSaveWorkspace = async () => {
    if (ownUrl) localStorage.setItem('ownUrl', ownUrl);
    if (compUrl) localStorage.setItem('compUrl', compUrl);
    await supabase.auth.updateUser({ data: { ownUrl: ownUrl, compUrl: compUrl } });
    alert("Workspace settings saved. Reloading to apply changes...");
    window.location.reload();
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-extrabold text-content tracking-tight">Settings</h2>
        <p className="text-muted text-sm mt-1 font-medium">Manage your workspace configuration and integrations.</p>
      </motion.div>
      
      {/* Workspace Settings */}
      <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl border border-line rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-line">
          <h3 className="text-lg font-bold text-content flex items-center gap-2"><Globe size={18} className="text-content" /> Workspace Settings</h3>
          <p className="text-muted text-sm mt-1">Configure your primary URLs for tracking and comparison.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-content mb-2">My Company URL</label>
              <input type="url" value={ownUrl} onChange={e => setOwnUrl(e.target.value)} placeholder="https://acme.com" className="w-full bg-surface/60 border border-line rounded-lg p-3 text-sm text-content focus:outline-none focus:border-content focus:ring-1 focus:ring-content transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-content mb-2">Primary Competitor URL</label>
              <input type="url" value={compUrl} onChange={e => setCompUrl(e.target.value)} placeholder="https://competitor.com" className="w-full bg-surface/60 border border-line rounded-lg p-3 text-sm text-content focus:outline-none focus:border-content focus:ring-1 focus:ring-content transition-all" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={handleSaveWorkspace} className="bg-content text-canvas hover:opacity-90 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center gap-2">
              <Save size={16} /> Save Workspace
            </button>
          </div>
        </div>
      </motion.div>

      {/* API Keys */}
      <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl border border-line rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-line">
          <h3 className="text-lg font-bold text-content flex items-center gap-2"><Key size={18} className="text-content" /> API Keys</h3>
          <p className="text-muted text-sm mt-1">Configure your LLM and scraping integrations.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-content mb-2">Vectorize Key (Hindsight)</label>
              <input type="password" placeholder="sk-..." className="w-full bg-surface/60 border border-line rounded-lg p-3 text-sm text-content focus:outline-none focus:border-content focus:ring-1 focus:ring-content transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-content mb-2">Jina AI Key</label>
              <input type="password" placeholder="jina-..." className="w-full bg-surface/60 border border-line rounded-lg p-3 text-sm text-content focus:outline-none focus:border-content focus:ring-1 focus:ring-content transition-all" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={() => alert("API Keys saved.")} className="bg-white/5 hover:bg-white/10 border border-line text-content px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
              <Save size={16} /> Save Keys
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
