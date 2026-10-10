import React, { useState } from 'react';
import { Calendar, Clock, Mail, CheckCircle2, Send, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';

export const ScheduledReports = () => {
  const { supabase } = useData();
  const [email] = useState(() => localStorage.getItem('userEmail') || 'demo@senro.ai');
  const [compUrl] = useState(() => localStorage.getItem('compUrl') || '');
  const [reportFreq, setReportFreq] = useState(() => localStorage.getItem('reportFreq') || 'never');
  const [customTime, setCustomTime] = useState(() => localStorage.getItem('reportTime') || '08:00');
  const [saved, setSaved] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);

  const handleSaveFreq = async (val: string) => {
    setReportFreq(val);
    localStorage.setItem('reportFreq', val);
    showSavedToast();
    try { await supabase.from('user_settings').update({ email_report_frequency: val }).eq('email', email); } catch(e) {}
  };

  const handleSaveTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTime(val);
    localStorage.setItem('reportTime', val);
    showSavedToast();
  };

  const showSavedToast = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSendNow = async () => {
    if (!compUrl) return alert("Please set a competitor URL in Settings first.");
    
    let targetEmail = email;
    if (email === 'demo@senro.ai') {
      const promptEmail = window.prompt("You are using a guest account. What email address should we send the report to?", "yourname@example.com");
      if (!promptEmail || promptEmail === "yourname@example.com") {
        return; 
      }
      targetEmail = promptEmail;
    } else {
      if (!window.confirm(`Ready to send the report to ${targetEmail}?`)) return;
    }

    setSendingNow(true);
    try {
      const response = await fetch('/api/send-hindsight-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, competitorUrl: compUrl })
      });
      const res = await response.json();
      if (res.error) alert("Error: " + res.error);
      else if (res.simulated) alert(`Simulated Send: No email credentials found on server. Check console for email HTML.`);
      else alert(`Report sent successfully to ${targetEmail}!`);
    } catch (e) {
      alert("Failed to send email.");
    } finally {
      setSendingNow(false);
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
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pb-10"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-content flex items-center gap-2 tracking-tight">
            <Calendar className="text-content mb-1" /> Automated Reports
          </h2>
          <p className="text-muted text-sm mt-1.5 font-medium">Configure your email intelligence summaries sent via Resend & Vercel Cron.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSendNow}
          disabled={sendingNow}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-content text-canvas hover:opacity-90 disabled:opacity-50 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg"
        >
          {sendingNow ? <Activity size={18} className="animate-spin" /> : <Send size={18} />}
          {sendingNow ? 'Sending...' : 'Send Email Now'}
        </motion.button>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4 }}
          onClick={() => handleSaveFreq('daily')}
          className={`cursor-pointer border rounded-2xl p-6 sm:p-8 transition-all shadow-lg backdrop-blur-sm relative overflow-hidden group ${reportFreq === 'daily' ? 'bg-surface-elevated border-content shadow-xl' : 'bg-surface/80 backdrop-blur-xl/90 border-line/80 hover:border-line-hover'}`}
        >
          <div className="flex justify-between items-start mb-6 relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${reportFreq === 'daily' ? 'bg-content text-canvas' : 'bg-surface-hover group-hover:bg-surface-hover'}`}>
              <Mail size={20} className={reportFreq === 'daily' ? 'text-canvas' : 'text-content'} />
            </div>
            {reportFreq === 'daily' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={24} className="text-content" /></motion.div>}
          </div>
          <h3 className="text-content font-bold text-xl mb-2 tracking-tight">Daily Brief</h3>
          <p className="text-muted text-sm leading-relaxed">A quick daily pulse of competitor changes.</p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4 }}
          onClick={() => handleSaveFreq('twice_a_day')}
          className={`cursor-pointer border rounded-2xl p-6 sm:p-8 transition-all shadow-lg backdrop-blur-sm relative overflow-hidden group ${reportFreq === 'twice_a_day' ? 'bg-surface-elevated border-content shadow-xl' : 'bg-surface/80 backdrop-blur-xl/90 border-line/80 hover:border-line-hover'}`}
        >
          <div className="flex justify-between items-start mb-6 relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${reportFreq === 'twice_a_day' ? 'bg-content text-canvas' : 'bg-surface-hover group-hover:bg-surface-hover'}`}>
              <Clock size={20} className={reportFreq === 'twice_a_day' ? 'text-canvas' : 'text-content'} />
            </div>
            {reportFreq === 'twice_a_day' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={24} className="text-content" /></motion.div>}
          </div>
          <h3 className="text-content font-bold text-xl mb-2 tracking-tight">Twice a Day</h3>
          <p className="text-muted text-sm leading-relaxed">Sent morning and evening for rapid updates.</p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4 }}
          onClick={() => handleSaveFreq('weekly')}
          className={`cursor-pointer border rounded-2xl p-6 sm:p-8 transition-all shadow-lg backdrop-blur-sm relative overflow-hidden group ${reportFreq === 'weekly' ? 'bg-surface-elevated border-content shadow-xl' : 'bg-surface/80 backdrop-blur-xl/90 border-line/80 hover:border-line-hover'}`}
        >
          <div className="flex justify-between items-start mb-6 relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${reportFreq === 'weekly' ? 'bg-content text-canvas' : 'bg-surface-hover group-hover:bg-surface-hover'}`}>
              <Calendar size={20} className={reportFreq === 'weekly' ? 'text-canvas' : 'text-content'} />
            </div>
            {reportFreq === 'weekly' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={24} className="text-content" /></motion.div>}
          </div>
          <h3 className="text-content font-bold text-xl mb-2 tracking-tight">Weekly Digest</h3>
          <p className="text-muted text-sm leading-relaxed">A high-level overview sent every Monday.</p>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl/90  border border-line/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg">
        <div>
          <h3 className="text-content font-bold text-lg mb-1.5 tracking-tight">Preferred Delivery Time</h3>
          <p className="text-muted text-sm">Choose exactly when you want your scheduled reports to arrive.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Clock size={20} className="text-muted hidden sm:block" />
          <input 
            type="time" 
            value={customTime}
            onChange={handleSaveTime}
            className="w-full sm:w-auto bg-surface/60 border border-line text-content font-medium rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-content focus:border-content transition-all shadow-inner"
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface/80 backdrop-blur-xl/90  border border-line/80 rounded-2xl p-6 sm:p-8 gap-6 shadow-lg">
        <div>
          <h4 className="text-content font-bold text-lg mb-1.5 tracking-tight">Pause automated reports</h4>
          <p className="text-muted text-sm">Temporarily stop receiving email summaries.</p>
        </div>
        <motion.button 
          whileHover={reportFreq !== 'never' ? { scale: 1.02 } : {}}
          whileTap={reportFreq !== 'never' ? { scale: 0.98 } : {}}
          onClick={() => handleSaveFreq('never')}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${reportFreq === 'never' ? 'bg-surface-hover/50 text-muted cursor-default border border-line/50' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-inverted border border-red-500/20 shadow-lg shadow-red-900/10'}`}
        >
          {reportFreq === 'never' ? 'Currently Paused' : 'Pause Emails'}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-emerald-500 text-inverted px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium"
          >
            <CheckCircle2 size={20} /> Preferences updated successfully
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
