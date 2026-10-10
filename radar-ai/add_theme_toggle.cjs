const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add Sun/Moon icons
if (!code.includes('Sun')) {
    code = code.replace("import { LayoutDashboard", "import { Sun, Moon, LayoutDashboard");
}

// Add state and effect in DashboardLayout
const layoutStart = "const DashboardLayout = ({ children }: { children: React.ReactNode }) => {";
if (code.includes(layoutStart) && !code.includes('const [isDark, setIsDark]')) {
    const themeLogic = `
  const [isDark, setIsDark] = React.useState(() => {
    return localStorage.getItem('theme') !== 'light'; // default to dark
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
`;
    code = code.replace(layoutStart, layoutStart + themeLogic);
}

// Add toggle button to header
const headerTarget = '<div className="flex items-center gap-4">';
if (code.includes(headerTarget) && !code.includes('onClick={() => setIsDark(!isDark)}')) {
    const toggleBtn = `
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-content hover:bg-white/10 transition-colors backdrop-blur-md"
            title="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>`;
    code = code.replace(headerTarget, headerTarget + toggleBtn);
}

// Ensure AuthScreen also respects the theme (if it exists)
// AuthScreen doesn't have the toggle, but we can set the initial class in the main App component
const appStart = "function App() {";
if (code.includes(appStart) && !code.includes("useEffect(() => { const theme = localStorage.getItem('theme');")) {
    const globalThemeInit = `
  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);
`;
    code = code.replace(appStart, appStart + globalThemeInit);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Added theme toggle to App.tsx");
