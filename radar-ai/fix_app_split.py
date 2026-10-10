with open('src/App.tsx', 'r') as f:
    app_code = f.read()

# Let's completely recreate App.tsx to be minimal and clean.
new_app_code = """import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';

import AuthScreen from './pages/AuthScreen';
import { OnboardingStep1, OnboardingStep2, OnboardingStep3 } from './pages/Onboarding';
import DashboardLayout from './layouts/DashboardLayout';

import { Overview } from './components/Overview';
import { CompareHub } from './components/CompareHub';
import { BattlecardsList } from './components/BattlecardsList';
import { LiveSignals } from './components/LiveSignals';
import { SettingsUI } from './components/SettingsUI';
import { Profile } from './components/Profile';
import { ScheduledReports } from './components/ScheduledReports';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';

function App() {
  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);

  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthScreen isLogin={true} />} />
          <Route path="/signup" element={<AuthScreen isLogin={false} />} />
          
          <Route path="/onboarding/step-1" element={<OnboardingStep1 />} />
          <Route path="/onboarding/step-2" element={<OnboardingStep2 />} />
          <Route path="/onboarding/step-3" element={<OnboardingStep3 />} />
          
          <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
          <Route path="/dashboard/compare" element={<DashboardLayout><CompareHub /></DashboardLayout>} />
          <Route path="/dashboard/live-signals" element={<DashboardLayout><LiveSignals /></DashboardLayout>} />
          <Route path="/dashboard/battlecards" element={<DashboardLayout><BattlecardsList /></DashboardLayout>} />
          <Route path="/dashboard/settings" element={<DashboardLayout><SettingsUI /></DashboardLayout>} />
          <Route path="/dashboard/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
          <Route path="/dashboard/reports" element={<DashboardLayout><ScheduledReports /></DashboardLayout>} />
          <Route path="/dashboard/privacy" element={<DashboardLayout><PrivacyPolicy /></DashboardLayout>} />
          <Route path="/dashboard/terms" element={<DashboardLayout><Terms /></DashboardLayout>} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
"""

with open('src/App.tsx', 'w') as f:
    f.write(new_app_code)

# And now let's write the complete DashboardLayout.tsx
dashboard_layout_code = """import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Plus, Sun, Moon } from 'lucide-react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  const [isDark, setIsDark] = React.useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const [showModal, setShowModal] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('compUrl', urlInput);
    setShowModal(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-canvas text-content flex flex-col font-sans selection:bg-white/20 selection:text-content">
      {/* Floating Pill Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl liquid-glass rounded-full px-4 py-3 flex items-center justify-between"
      >
        <Link to="/dashboard" className="flex items-center gap-3 pl-2 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-7 h-7 rounded-full bg-content flex items-center justify-center shadow-lg"
          >
            <Target size={14} strokeWidth={2} className="text-canvas" />
          </motion.div>
          <span className="text-sm font-semibold tracking-wide text-content group-hover:opacity-80 transition-opacity">SENRO</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {[
            { to: '/dashboard', label: 'Overview' },
            { to: '/dashboard/compare', label: 'Competitors' },
            { to: '/dashboard/live-signals', label: 'Signals' },
            { to: '/dashboard/battlecards', label: 'Battlecards' },
          ].map(link => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={`text-xs font-medium tracking-wide transition-all hover:text-content ${location.pathname === link.to ? 'text-white' : 'text-muted'}`}
            >
              {link.label}
              {location.pathname === link.to && (
                <motion.div layoutId="nav-indicator" className="h-[2px] w-full bg-content mt-1 absolute rounded-full" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-content text-canvas hover:opacity-90 transition-all shadow-lg"
          >
            <Plus size={14} strokeWidth={2} /> 
            <span className="hidden sm:inline">Add Target</span>
          </button>
          
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center text-content text-xs font-medium hover:bg-line-hover transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <Link to="/dashboard/profile" className="w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center text-white text-xs font-medium hover:bg-line-hover transition-colors">
            {localStorage.getItem('userEmail')?.charAt(0).toUpperCase() || 'S'}
          </Link>
        </div>
      </motion.nav>

      <main className="flex-1 w-full max-w-6xl mx-auto pt-32 pb-20 px-6 sm:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Extreme Minimal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
            onClick={() => setShowModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg bg-surface border border-line rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <h3 className="text-2xl font-light tracking-tight text-white mb-2">Track new entity.</h3>
              <p className="text-sm text-muted mb-8">Enter the primary URL of the competitor you want to monitor. Our engines will map their entire public footprint.</p>
              
              <form onSubmit={handleAddCompetitor} className="space-y-6">
                <div className="relative">
                  <input 
                    autoFocus
                    type="url" 
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com" 
                    required
                    className="w-full bg-transparent border-b border-line pb-4 text-lg text-content placeholder-muted focus:border-content focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="text-xs tracking-widest uppercase font-medium text-muted hover:text-content transition-colors">Abort</button>
                  <button type="submit" className="text-xs tracking-widest uppercase font-bold text-canvas bg-content px-6 py-3 rounded-full hover:opacity-90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    Initialize
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
"""

with open('src/layouts/DashboardLayout.tsx', 'w') as f:
    f.write(dashboard_layout_code)
