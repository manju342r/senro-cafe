import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add the sun/moon icon toggle to the navbar
# And update the isDark state to actually toggle the .dark class

new_toggle_code = """
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
"""

content = re.sub(r'const \[isDark, setIsDark\] = React\.useState\(true\);', new_toggle_code, content)

# Inject the toggle button into the nav
nav_button = """
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center text-content text-xs font-medium hover:bg-line-hover transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
"""

# Let's find the profile link and put it before it
content = content.replace(
    '<Link to="/dashboard/profile" className="w-8 h-8',
    nav_button + '\n          <Link to="/dashboard/profile" className="w-8 h-8'
)

# Also ensure Sun and Moon are imported
if "Moon" not in content:
    content = content.replace("import { Target,", "import { Target, Sun, Moon,")

with open('src/App.tsx', 'w') as f:
    f.write(content)
