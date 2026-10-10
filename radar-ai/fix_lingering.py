import os
import glob

files = glob.glob('src/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        code = f.read()

    # Replacing opacities that break light mode visibility
    code = code.replace("bg-zinc-900", "bg-surface-hover")
    code = code.replace("bg-zinc-700", "bg-surface-hover")
    code = code.replace("bg-[#0f0f13]/90", "bg-surface/90")
    
    with open(file, 'w') as f:
        f.write(code)

print("Fixed lingering bg-zinc.")
