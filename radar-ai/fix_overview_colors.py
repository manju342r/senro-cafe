import re

with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

replacements = {
    'stroke="#ffffff"': 'stroke="var(--color-content)"',
    'stopColor="#ffffff"': 'stopColor="var(--color-content)"',
    'stopColor="#333333"': 'stopColor="var(--color-muted)"',
    'text-white': 'text-content',
    'border-white/10': 'border-line',
    'border-white/20': 'border-line',
    'hover:bg-white text-white hover:text-black': 'hover:bg-content text-content hover:text-canvas',
    'bg-white/5': 'bg-surface-elevated',
    'ring-white/10': 'ring-line',
    'bg-[#000]': 'bg-surface',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/Overview.tsx', 'w') as f:
    f.write(content)
