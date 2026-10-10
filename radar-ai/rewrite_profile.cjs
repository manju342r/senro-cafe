const fs = require('fs');

const code = `import React, { useState } from 'react';
import { LogOut, User, Building, Mail, Shield, CreditCard, Clock, Globe, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';

export const Profile = () => {
  const email = localStorage.getItem('userEmail') || 'demo@senro.ai';
  const { supabase } = useData();
  const [loading, setLoading] = useState(false);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); alert("Profile saved successfully."); }, 800);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Account Settings</h2>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Manage your personal information, billing, and security.</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50">
          <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>
      
      {/* Profile Header Card */}
      <motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-4xl shadow-xl shrink-0">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-2xl font-bold text-zinc-100">{email}</h3>
          <p className="text-zinc-400 text-sm mt-1 mb-4">Senro.AI Administrator • Joined Sep 2024</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">Pro Tier</span>
            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">Active</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-2 bg-zinc-900/60 rounded-lg"><User size={18} className="text-zinc-400" /></div>
              <h3 className="text-lg font-bold text-zinc-100">Personal Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">First Name</label>
                <input type="text" defaultValue="Manjunath" className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Last Name</label>
                <input type="text" defaultValue="Chakri" className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="email" disabled defaultValue={email} className="w-full bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-lg pl-9 pr-3 py-3 text-sm text-zinc-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Company Details */}
          <motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-2 bg-zinc-900/60 rounded-lg"><Building size={18} className="text-zinc-400" /></div>
              <h3 className="text-lg font-bold text-zinc-100">Company Profile</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Company Name</label>
                <input type="text" defaultValue="Acme Corp" className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">Job Role</label>
                <input type="text" defaultValue="Founder / CEO" className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          {/* Preferences */}
          <motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-5 border-b border-white/5 flex items-center gap-3">
              <h3 className="text-base font-bold text-zinc-100">Preferences</h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2"><Globe size={14}/> Language</label>
                <select className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-all appearance-none">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2"><Clock size={14}/> Timezone</label>
                <select className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-all appearance-none">
                  <option>Pacific Time (PT)</option>
                  <option>Eastern Time (ET)</option>
                  <option>Coordinated Universal Time (UTC)</option>
                  <option>Indian Standard Time (IST)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Billing Summary */}
          <motion.div variants={itemVariants} className="bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-500/20 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-5 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg"><CreditCard size={18} className="text-blue-400" /></div>
              <h3 className="text-base font-bold text-zinc-100">Plan & Usage</h3>
            </div>
            <div className="px-5 pb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Competitors Tracked</span>
                <span className="text-zinc-200 font-medium">3 / 10</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 mb-6">
                <div className="bg-blue-500 h-1.5 rounded-full w-[30%]"></div>
              </div>
              <button className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-200 py-2 rounded-lg text-sm font-semibold transition-colors">
                Manage Billing
              </button>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants} className="bg-red-950/10 border border-red-900/20 rounded-2xl overflow-hidden shadow-lg p-5">
            <h3 className="text-base font-bold text-red-500 mb-4 flex items-center gap-2"><Shield size={16}/> Danger Zone</h3>
            <div className="space-y-3">
              <button onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem('userEmail'); window.location.href = '/login'; }} className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                <LogOut size={16} /> Sign out of Senro.AI
              </button>
              <button onClick={() => { if(window.confirm("Are you sure you want to delete your account? This is irreversible.")) alert("Account deleted."); }} className="w-full text-zinc-500 hover:text-red-400 text-xs font-medium py-2 transition-colors">
                Delete Account
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};
`

fs.writeFileSync('src/components/Profile.tsx', code);
console.log('Profile rewritten.');
