import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the layout
layout_code = """
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = React.useState(true);
  const location = useLocation();
  const [showModal, setShowModal] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');
  const [isConfigured] = React.useState(true);

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('compUrl', urlInput);
    setShowModal(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-canvas text-content flex flex-col font-sans selection:bg-white/20 selection:text-white">
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
            className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          >
            <Target size={14} strokeWidth={2} className="text-black" />
          </motion.div>
          <span className="text-sm font-semibold tracking-wide text-white group-hover:opacity-80 transition-opacity">SENRO</span>
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
              className={`text-xs font-medium tracking-wide transition-all hover:text-white ${location.pathname === link.to ? 'text-white' : 'text-muted'}`}
            >
              {link.label}
              {location.pathname === link.to && (
                <motion.div layoutId="nav-indicator" className="h-[2px] w-full bg-white mt-1 absolute rounded-full" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            <Plus size={14} strokeWidth={2} /> 
            <span className="hidden sm:inline">Add Target</span>
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
            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            onClick={() => setShowModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
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
                    className="w-full bg-transparent border-b border-white/20 pb-4 text-lg text-white placeholder-white/20 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="text-xs tracking-widest uppercase font-medium text-muted hover:text-white transition-colors">Abort</button>
                  <button type="submit" className="text-xs tracking-widest uppercase font-bold text-black bg-white px-6 py-3 rounded-full hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
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
"""

# Now we need to slice out the old DashboardLayout and replace it
# It starts at `const DashboardLayout =` and ends right before `function App() {`
start_idx = content.find("const DashboardLayout =")
end_idx = content.find("function App() {")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + layout_code + "\n" + content[end_idx:]
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Patched layout in App.tsx")
else:
    print("Could not find DashboardLayout bounds")
