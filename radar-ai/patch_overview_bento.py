import re

with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

# Make the grid a gapless bento
# Change classes like `grid-cols-1 md:grid-cols-3 gap-6 mb-8` to a gapless grid.
# Replace `bg-surface border border-line rounded-2xl` with a sharp bento box `bg-surface border border-line` and tight radiuses?
# Actually gapless bento is `grid gap-[1px] bg-line border border-line rounded-3xl overflow-hidden`. 
# The cells themselves have `bg-surface` and no borders, so the 1px gap looks like a border.
# Let's replace the grid div for cards:
replacements = {
    # Typography & spacing
    "text-2xl font-bold mb-6": "text-4xl font-light tracking-tight mb-12",
    "bg-surface border border-line rounded-2xl p-6 relative overflow-hidden": "bg-surface p-8 relative overflow-hidden",
    "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8": "grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-line border border-line rounded-3xl overflow-hidden mb-16",
    "bg-surface border border-line rounded-2xl p-6 shadow-sm": "bg-surface border border-line rounded-3xl p-8 shadow-2xl",
    "grid grid-cols-1 lg:grid-cols-3 gap-6": "grid grid-cols-1 lg:grid-cols-3 gap-8",
    "lg:col-span-2 space-y-6": "lg:col-span-2 space-y-8",
    
    # Specific chart color fixes for minimal monochrome
    'stroke="#09663f"': 'stroke="#ffffff"',
    'stopColor="#09663f"': 'stopColor="#ffffff"',
    'stopColor="#5bc59a"': 'stopColor="#333333"',
    'fill="url(#colorThreat)"': 'fill="url(#colorThreat)" fillOpacity={0.05}',
    
    # Tooltip styles
    "bg-[#18181b] border border-line-hover/50": "bg-[#000] border border-white/10 liquid-glass",
    "text-brand-mint": "text-white text-xs uppercase tracking-widest",
    "text-xs text-amber-400 font-bold": "text-[10px] text-white/60 uppercase tracking-widest font-mono",
    
    # Sub-text
    "text-sm font-medium text-muted": "text-xs uppercase tracking-widest text-muted font-medium mb-4 block",
    "text-3xl font-bold mt-2 text-content": "text-5xl font-light tracking-tighter text-content",
    
    # Badges
    "bg-emerald-500/10 text-emerald-500": "bg-white/5 text-white ring-1 ring-white/10",
    "bg-red-500/10 text-red-500": "bg-white/5 text-white ring-1 ring-white/10",
    "bg-amber-500/10 text-amber-500": "bg-white/5 text-white ring-1 ring-white/10",
    
    # Button
    "bg-surface border border-line hover:bg-line-hover": "bg-transparent border border-white/20 hover:bg-white text-white hover:text-black",
    
    # Icon strokes
    "strokeWidth={2}": "strokeWidth={1.5}",
    
    # Radial glow removing
    "bg-brand-emerald p-3": "bg-white/5 p-4",
    "shadow-brand-emerald/20": "shadow-none",
    "text-inverted": "text-white",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/Overview.tsx', 'w') as f:
    f.write(content)
print("Patched Overview.tsx for Awwwards-tier minimal bento")

