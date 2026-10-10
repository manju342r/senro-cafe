import React, { useState, useEffect } from 'react';
import { Target, Zap, TrendingUp, AlertTriangle, Activity, Mail } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Overview = () => {
  const navigate = useNavigate();
  const { supabase, ingestToHindsight } = useData();
  const [ownUrl] = useState(() => localStorage.getItem('ownUrl') || 'https://acme.com');
  const [compUrl] = useState(() => localStorage.getItem('compUrl') || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('overviewData');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const mockTimelineData = [
    { name: 'Mon', threat: 20, signals: 1 },
    { name: 'Tue', threat: 35, signals: 3 },
    { name: 'Wed', threat: 30, signals: 2, annotation: "Hindsight: Competitor updated checkout flow" },
    { name: 'Thu', threat: 50, signals: 5 },
    { name: 'Fri', threat: 45, signals: 4 },
    { name: 'Sat', threat: 60, signals: 7, annotation: "Hindsight: Enterprise pricing tier detected" },
    { name: 'Sun', threat: 75, signals: 8 },
  ];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#18181b] border border-line-hover/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md"
        >
          <p className="text-content font-bold mb-1">{label}</p>
          <p className="text-violet-400 text-sm font-medium">Threat Score: {data.threat}</p>
          {data.annotation && (
            <div className="mt-3 pt-3 border-t border-line max-w-[220px]">
              <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider"><Zap size={12} /> Memory Annotation</p>
              <p className="text-xs text-content mt-1.5 leading-relaxed">{data.annotation}</p>
            </div>
          )}
        </motion.div>
      );
    }
    return null;
  };

  const [emailing, setEmailing] = useState(false);
  
  const handleEmailReport = async () => {
    if (!compUrl) return alert("Please click '+ Add Competitor' at the top right to start tracking.");
    let email = localStorage.getItem('userEmail');
    
    if (!email || email === 'demo@senro.ai' || email === 'demo@senro.ai (Guest)') {
      const promptEmail = window.prompt("Enter the email address you want to receive the report:", "yourname@example.com");
      if (!promptEmail || promptEmail === "yourname@example.com") return;
      email = promptEmail;
    } else {
      if (!window.confirm(`Ready to send report to ${email}?`)) return;
    }
    
    setEmailing(true);
    try {
      const response = await fetch('/api/send-hindsight-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, competitorUrl: compUrl })
      });
      const res = await response.json();
      if (res.error) alert("Error: " + res.error);
      else if (res.simulated) alert(`Simulated Send: No email credentials found on server. Check console for email HTML.`);
      else alert(`Hindsight Report sent to ${email}!`);
    } catch (e) {
      alert("Failed to send email.");
    } finally {
      setEmailing(false);
    }
  };

  const handleScan = async () => {
    if (!compUrl) return alert("Please click '+ Add Competitor' at the top right to start tracking.");
    setLoading(true);
    
    try {
      const response = await fetch('/api/analyze-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownUrl: ownUrl,
          competitorUrls: [compUrl]
        })
      });

      const result = await response.json();
      if (response.ok) {
        setData(result);
        localStorage.setItem('overviewData', JSON.stringify(result));
        if (result.analysis_summary) {
          await ingestToHindsight(compUrl, result.analysis_summary);
        }
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Failed to run analysis.");
    } finally {
      setLoading(false);
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url || 'competitor';
    }
  };

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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-8 pb-10 px-4 sm:px-6 lg:px-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-content flex items-center gap-2 tracking-tight">
            Dashboard
          </h2>
          <p className="text-muted text-sm mt-1.5 font-medium">
            Monitoring <span className="text-content">{compUrl ? getDomain(compUrl) : 'competitors'}</span> against <span className="text-content">{getDomain(ownUrl)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEmailReport}
            disabled={emailing || loading}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-surface/60 backdrop-blur-md/80 border border-line hover:border-line-hover hover:bg-surface-hover text-content px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50 backdrop-blur-sm shadow-sm"
          >
            {emailing ? <Activity size={16} className="animate-spin text-muted" /> : <Mail size={16} className="text-muted" />}
            {emailing ? 'Sending...' : 'Email Report'}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScan}
            disabled={loading}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-surface/60 backdrop-blur-md/80 border border-line hover:border-line-hover hover:bg-surface-hover text-content px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50 backdrop-blur-sm shadow-sm"
          >
            {loading ? <Activity size={16} className="animate-spin text-violet-500" /> : <Zap size={16} className="text-amber-500" />}
            {loading ? 'Analyzing...' : 'Trigger Scan'}
          </motion.button>
        </div>
      </motion.div>

      {/* Top Metrics Row */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-surface/80 backdrop-blur-xl/90 backdrop-blur-md border border-line/80 hover:border-line-hover p-6 rounded-2xl flex flex-col justify-between shadow-lg transition-colors group">
          <div className="text-xs font-bold text-muted tracking-widest uppercase">Strategic Gap Index</div>
          <div className="mt-5 flex items-end justify-between">
            <div className="text-4xl font-black text-content tracking-tight">{loading ? '--' : (data ? data.strategic_gap_index : '--')}</div>
            <TrendingUp size={24} className="text-emerald-500 mb-1 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-surface/80 backdrop-blur-xl/90 backdrop-blur-md border border-line/80 hover:border-line-hover p-6 rounded-2xl flex flex-col justify-between shadow-lg transition-colors group">
          <div className="text-xs font-bold text-muted tracking-widest uppercase">Traffic Impact</div>
          <div className="mt-5 flex items-end justify-between">
            <div className="text-3xl font-black text-content tracking-tight">{loading ? '--' : (data ? data.net_traffic_impact : '--')}</div>
            <Activity size={24} className="text-violet-500 mb-1 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-surface/80 backdrop-blur-xl/90 backdrop-blur-md border border-line/80 hover:border-line-hover p-6 rounded-2xl flex flex-col justify-between shadow-lg transition-colors group">
          <div className="text-xs font-bold text-muted tracking-widest uppercase">Threat Level</div>
          <div className="mt-5 flex items-end justify-between">
            <div className="text-3xl font-black text-content capitalize tracking-tight">{loading ? '--' : (data ? data.risk_level : '--')}</div>
            <AlertTriangle size={24} className={data?.risk_level === 'High' ? 'text-red-500 mb-1 opacity-80 group-hover:opacity-100 transition-opacity' : 'text-amber-500 mb-1 opacity-80 group-hover:opacity-100 transition-opacity'} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-surface/80 backdrop-blur-xl/90 backdrop-blur-md border border-line/80 hover:border-line-hover p-6 rounded-2xl flex flex-col justify-between shadow-lg transition-colors group">
          <div className="text-xs font-bold text-muted tracking-widest uppercase">Recent Signals</div>
          <div className="mt-5 flex items-end justify-between">
            <div className="text-4xl font-black text-content tracking-tight">{loading ? '--' : (data ? data.signals_24h : '--')}</div>
            <div className="text-sm font-medium text-muted mb-1.5">{loading ? '--' : (data ? data.signals_total : '--')} total</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
        <div className="bg-surface/80 backdrop-blur-xl/90 backdrop-blur-md border border-line/80 p-6 sm:p-8 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold text-content mb-6 uppercase tracking-widest flex items-center gap-2">
            Threat Score Timeline <span className="text-muted font-medium normal-case tracking-normal">(7 Days)</span>
          </h3>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="threat" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorThreat)" 
                  activeDot={{ r: 6, fill: "#3b82f6", stroke: "#121212", strokeWidth: 2 }} 
                  dot={(props: any) => { 
                    const { cx, cy, payload } = props; 
                    if (payload.annotation) { 
                      return <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="#121212" strokeWidth={2.5} key={payload.name} className="animate-pulse" />; 
                    } 
                    return <circle cx={cx} cy={cy} r={0} key={payload.name} />; 
                  }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* 2-Column Split: 60% / 40% */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN (60%) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {data?.analysis_summary && (
            <motion.div variants={itemVariants} className="bg-blue-900/10 border border-violet-500/30 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-400 to-violet-600"></div>
              <h3 className="text-sm font-bold text-violet-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                <Zap size={16} /> AI Executive Summary
              </h3>
              <p className="text-content text-sm sm:text-base leading-relaxed">
                {data.analysis_summary}
              </p>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl/90 backdrop-blur-md border border-line/80 p-6 sm:p-8 rounded-2xl shadow-lg flex-1">
            <h3 className="text-sm font-bold text-content mb-6 uppercase tracking-widest">Raw Live Signals</h3>
            <div className="space-y-4">
              {[
                { status: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', text: 'Pricing page frequency increased (+12%)', time: '2h ago' },
                { status: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', text: 'New "Enterprise" feature tier launched on homepage', time: '12h ago' },
                { status: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]', text: 'Checkout flow updated to require work email', time: '1d ago' }
              ].map((sig, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  key={i} 
                  className="flex items-start justify-between gap-4 border-b border-line/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className={"w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 " + sig.status}></div>
                    <p className="text-sm text-content leading-snug font-medium">{sig.text}</p>
                  </div>
                  <span className="text-xs text-muted font-medium flex-shrink-0">{sig.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN (40%) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-surface/80 backdrop-blur-xl/90 backdrop-blur-md border border-line/80 p-6 sm:p-8 rounded-2xl flex flex-col shadow-lg">
          <h3 className="text-sm font-bold text-content mb-6 uppercase tracking-widest">Recommended Actions</h3>
          <div className="space-y-6 flex-1">
            <div className="group">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2.5 py-1 rounded-md tracking-wider uppercase inline-block mb-3 transition-colors group-hover:bg-emerald-400/20">Pricing Strategy</span>
              <p className="text-sm text-muted leading-relaxed group-hover:text-content transition-colors">Adjust standard tier messaging to highlight transparent pricing against competitor's new opaque enterprise model.</p>
            </div>
            <div className="group">
              <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-500/20 px-2.5 py-1 rounded-md tracking-wider uppercase inline-block mb-3 transition-colors group-hover:bg-amber-400/20">Product Marketing</span>
              <p className="text-sm text-muted leading-relaxed group-hover:text-content transition-colors">Launch a comparison battlecard specifically targeting their missing SSO integration.</p>
            </div>
            <div className="group">
              <span className="text-xs font-bold text-violet-400 bg-blue-400/10 border border-violet-500/20 px-2.5 py-1 rounded-md tracking-wider uppercase inline-block mb-3 transition-colors group-hover:bg-blue-400/20">Sales Enablement</span>
              <p className="text-sm text-muted leading-relaxed group-hover:text-content transition-colors">Equip SDRs with objection handling for the competitor's new checkout flow changes.</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/battlecards')}
            className="w-full mt-8 py-3 bg-surface/60 backdrop-blur-md border border-line-hover/50 hover:bg-surface-hover hover:border-zinc-600 text-content rounded-2xl text-sm font-bold transition-all shadow-sm"
          >
            Generate Counter-Moves
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
