import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';

// --- ONBOARDING FLOW ---
const OnboardingLayout = ({ children, step }: { children: React.ReactNode, step: number }) => (
  <div className="min-h-screen bg-canvas text-content flex flex-col items-center justify-center p-8">
    <div className="w-full max-w-xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-content flex items-center gap-2">
          <Target size={20} className="text-content" /> Senro.AI Setup
        </h1>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 w-12 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-surface-hover'}`} />
          ))}
        </div>
      </div>
      <div className="bg-[#121212] border border-line p-8 rounded-2xl shadow-xl">
        {children}
      </div>
      <div className="mt-6 text-center">
        <Link to="/dashboard" className="text-sm text-muted hover:text-content transition-colors">
          Skip this for now (Testing)
        </Link>
      </div>
    </div>
  </div>
);

const OnboardingStep1 = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const { supabase } = useData();
  
  return (
    <OnboardingLayout step={1}>
      <h2 className="text-2xl font-bold text-content mb-2">My Workspace</h2>
      <p className="text-muted mb-6 text-sm">Tell us about your company so we can monitor your own visibility baseline.</p>
      <form onSubmit={(e) => { 
        e.preventDefault(); 
        
        if(url) {
          localStorage.setItem('ownUrl', url);
          supabase.auth.updateUser({ data: { ownUrl: url } }).then(() => {
            navigate('/onboarding/step-2');
          });
        } else {
          navigate('/onboarding/step-2');
        }
 
      }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Company Name</label>
          <input type="text" required placeholder="e.g. Acme Corp" className="w-full bg-canvas border border-line rounded-lg p-3 text-content focus:border-content focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Company Website Link</label>
          <input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://acme.com" className="w-full bg-canvas border border-line rounded-lg p-3 text-content focus:border-content focus:outline-none" />
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-dark text-inverted font-medium py-3 rounded-lg transition-colors mt-6">
          Next Step <ArrowRight size={18} />
        </button>
      </form>
    </OnboardingLayout>
  );
};

const OnboardingStep2 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [compUrl, setCompUrl] = useState('');
  const { supabase } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(compUrl) {
      localStorage.setItem('compUrl', compUrl);
      await supabase.auth.updateUser({ data: { compUrl: compUrl } });
    }
    setLoading(true);
    try {
      const res = await fetch('/api/config-status');
      const data = await res.json();
      if (data.configured) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/step-3');
      }
    } catch (err) {
      console.error(err);
      navigate('/onboarding/step-3'); // fallback
    }
  };

  return (
    <OnboardingLayout step={2}>
      <h2 className="text-2xl font-bold text-content mb-2">The Opponent</h2>
      <p className="text-muted mb-6 text-sm">Who is your primary competitor? We will track their changes against your baseline.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Opponent Company Name</label>
          <input type="text" required placeholder="e.g. Globex" className="w-full bg-canvas border border-line rounded-lg p-3 text-content focus:border-content focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Opponent Website Link</label>
          <input type="url" required value={compUrl} onChange={e => setCompUrl(e.target.value)} placeholder="https://globex.com" className="w-full bg-canvas border border-line rounded-lg p-3 text-content focus:border-content focus:outline-none" />
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-dark disabled:opacity-50 text-inverted font-medium py-3 rounded-lg transition-colors mt-6">
          {loading ? 'Checking configuration...' : <>Next Step <ArrowRight size={18} /></>}
        </button>
      </form>
    </OnboardingLayout>
  );
};

const OnboardingStep3 = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    fetch('/api/config-status')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          navigate('/dashboard');
        }
      })
      .catch(console.error);
  }, [navigate]);

  return (
    <OnboardingLayout step={3}>
      <h2 className="text-2xl font-bold text-content mb-2">API Configuration</h2>
      <p className="text-muted mb-6 text-sm">Connect the engines powering Senro.AI's memory, scraping, and email systems.</p>
      <form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Jina API Key</label>
            <input type="password" placeholder="Optional" className="w-full bg-input border border-line rounded-xl p-3 text-sm text-content focus:border-brand-emerald/50 focus:ring-4 focus:ring-brand-emerald/10 focus:outline-none transition-all shadow-inner" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Vectorize Hindsight Key</label>
            <input type="password" placeholder="Optional" className="w-full bg-canvas border border-line rounded-lg p-2.5 text-sm text-content focus:border-content focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Resend Key</label>
            <input type="password" placeholder="Optional" className="w-full bg-canvas border border-line rounded-lg p-2.5 text-sm text-content focus:border-content focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">LLM Key</label>
            <input type="password" placeholder="Optional" className="w-full bg-canvas border border-line rounded-lg p-2.5 text-sm text-content focus:border-content focus:outline-none" />
          </div>
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-inverted font-medium py-3 rounded-lg transition-colors mt-6 shadow-lg shadow-emerald-900/20">
          Complete Setup <CheckCircle2 size={18} />
        </button>
      </form>
    </OnboardingLayout>
  );
};

export { OnboardingStep1, OnboardingStep2, OnboardingStep3 };
