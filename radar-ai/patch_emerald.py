import os
import glob

replacements = {
    "bg-gradient-to-br from-violet-500 to-fuchsia-600": "bg-brand-emerald",
    "bg-gradient-to-r from-violet-600 to-fuchsia-600": "bg-brand-emerald",
    "text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600": "text-brand-emerald",
    "hover:from-violet-500 hover:to-fuchsia-500": "hover:bg-brand-dark",
    "shadow-violet-900/40": "shadow-brand-emerald/40",
    "shadow-violet-900/20": "shadow-brand-emerald/20",
    "focus:border-violet-500/50": "focus:border-brand-emerald/50",
    "focus:ring-violet-500/10": "focus:ring-brand-emerald/10",
    "hover:ring-violet-500/30": "hover:ring-brand-emerald/30",
    "text-violet-600": "text-brand-emerald",
    "bg-violet-600": "bg-brand-emerald",
    "hover:bg-violet-700": "hover:bg-brand-dark",
    "border-violet-500/30": "border-brand-emerald/30",
    "text-fuchsia-600": "text-brand-mint",
    "bg-surface-glass backdrop-blur-2xl": "bg-surface",
    "bg-surface-glass backdrop-blur-xl": "bg-surface",
    "bg-surface/90 backdrop-blur-2xl": "bg-surface",
    "backdrop-blur-md": "",
    "ring-white/5": "ring-line",
    # Specific sidebar override
    'aside className="w-64 bg-surface-glass backdrop-blur-2xl border-r border-line': 'aside className="w-64 bg-brand-emerald text-inverted border-r-0',
    # Sidebar item unselected text
    'text-muted hover:bg-surface-hover hover:text-content': 'text-inverted/70 hover:bg-white/10 hover:text-inverted',
    # Sidebar item selected text
    'bg-surface-hover text-content font-medium': 'bg-white/10 text-inverted font-bold',
    'bg-surface-glass': 'bg-surface'
}

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                
            original = content
            for old, new in replacements.items():
                content = content.replace(old, new)
                
            if content != original:
                with open(path, 'w') as f:
                    f.write(content)
                print(f"Patched {path}")

