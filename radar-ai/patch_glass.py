import os
import glob

files = [
    "src/components/CompareHub.tsx",
    "src/components/BattlecardsList.tsx",
    "src/components/LiveSignals.tsx",
    "src/components/SettingsUI.tsx",
    "src/components/Overview.tsx",
    "src/components/ScheduledReports.tsx"
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r') as f:
            content = f.read()
            
        # Replace solid borders and backgrounds with transparent/glass equivalents
        content = content.replace("bg-[#121212]", "bg-[#121212]/80 backdrop-blur-xl")
        content = content.replace("bg-zinc-900", "bg-zinc-900/60 backdrop-blur-md")
        content = content.replace("bg-zinc-900/80", "bg-zinc-900/60 backdrop-blur-md")
        content = content.replace("border-zinc-800", "border-white/5")
        
        # Rounded corners: make them slightly rounder (rounded-xl -> rounded-2xl where appropriate)
        # We won't do universal replace to avoid breaking things, but let's change some.
        content = content.replace("rounded-xl", "rounded-2xl")
        content = content.replace("rounded-lg", "rounded-xl")
        
        with open(file, 'w') as f:
            f.write(content)

print("Applied global glass and radius patches.")
