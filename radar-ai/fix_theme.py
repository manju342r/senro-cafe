with open('src/index.css', 'r') as f:
    content = f.read()

# Let's replace the whole :root section
new_css = """@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --color-canvas: var(--color-canvas-val);
  --color-surface: var(--color-surface-val);
  --color-surface-elevated: var(--color-surface-elevated-val);
  --color-input: var(--color-input-val);
  --color-line: var(--color-line-val);
  --color-line-hover: var(--color-line-hover-val);
  --color-content: var(--color-content-val);
  --color-muted: var(--color-muted-val);
  --color-accent: var(--color-accent-val);
  --color-accent-subtle: var(--color-accent-subtle-val);
}

:root {
  /* Premium Minimalist Light Mode */
  color-scheme: light;
  --color-canvas-val: #f9f9f9;
  --color-surface-val: #ffffff;
  --color-surface-elevated-val: #f0f0f0;
  --color-input-val: rgba(0, 0, 0, 0.03);
  --color-line-val: rgba(0, 0, 0, 0.08);
  --color-line-hover-val: rgba(0, 0, 0, 0.15);
  --color-content-val: #050505;
  --color-muted-val: #777777;
  --color-accent-val: #000000;
  --color-accent-subtle-val: #e5e5e5;
  
  --glass-bg: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4));
  --glass-border: rgba(0,0,0,0.05);
  --glass-border-inner: rgba(255,255,255,0.5);
  --glass-shadow: 0 8px 32px rgba(0,0,0,0.05);
  
  --bg-glow-1: rgba(0, 0, 0, 0.02);
  --bg-glow-2: rgba(0, 0, 0, 0.01);
}

:root.dark {
  /* Tactical/Dark Tech Dark Mode */
  color-scheme: dark;
  --color-canvas-val: #030303;
  --color-surface-val: #0a0a0a;
  --color-surface-elevated-val: #111111;
  --color-input-val: rgba(255, 255, 255, 0.03);
  --color-line-val: rgba(255, 255, 255, 0.08);
  --color-line-hover-val: rgba(255, 255, 255, 0.15);
  --color-content-val: #ffffff;
  --color-muted-val: #888888;
  --color-accent-val: #ffffff;
  --color-accent-subtle-val: #222222;

  --glass-bg: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01));
  --glass-border: rgba(255,255,255,0.08);
  --glass-border-inner: rgba(255,255,255,0.1);
  --glass-shadow: 0 8px 32px rgba(0,0,0,0.4);
  
  --bg-glow-1: rgba(255, 255, 255, 0.03);
  --bg-glow-2: rgba(255, 255, 255, 0.02);
}

body {
  margin: 0;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--color-canvas-val);
  color: var(--color-content-val);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-image: 
    radial-gradient(circle at 50% 0%, var(--bg-glow-1) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, var(--bg-glow-2) 0%, transparent 50%);
  background-attachment: fixed;
  background-size: cover;
  min-height: 100dvh;
  transition: background-color 0.4s ease, color 0.4s ease;
}

/* Premium scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--color-line-hover-val);
  border-radius: 999px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}

/* Apple Liquid Glass Approx (From Appendix C) */
.liquid-glass {
  position: relative;
  isolation: isolate;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid var(--glass-border);
  box-shadow: 
    inset 0 1px 0 var(--glass-border-inner),
    var(--glass-shadow);
  transition: all 0.4s ease;
}

.liquid-glass::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  border: 1px solid var(--glass-border);
  pointer-events: none;
}
"""

with open('src/index.css', 'w') as f:
    f.write(new_css)
