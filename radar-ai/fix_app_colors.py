import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace hardcoded absolute colors with theme variables for Light/Dark adaptability
replacements = {
    'className="text-black"': 'className="text-canvas"',
    'bg-white flex': 'bg-content flex',
    'text-white group-hover': 'text-content group-hover',
    'text-white"': 'text-content"',
    'bg-white mt-1': 'bg-content mt-1',
    'bg-white text-black': 'bg-content text-canvas',
    'hover:bg-white/90': 'hover:opacity-90',
    'shadow-[0_0_20px_rgba(255,255,255,0.15)]': 'shadow-lg',
    'shadow-[0_0_15px_rgba(255,255,255,0.4)]': 'shadow-lg',
    'bg-[#111]': 'bg-surface',
    'text-white placeholder-white/20 focus:border-white': 'text-content placeholder-muted focus:border-content',
    'border-white/10': 'border-line',
    'border-white/20': 'border-line',
    'hover:text-white': 'hover:text-content',
    'text-black bg-white': 'text-canvas bg-content',
    'bg-black/80': 'bg-black/60',
    'text-white text-xs uppercase': 'text-content text-xs uppercase'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
