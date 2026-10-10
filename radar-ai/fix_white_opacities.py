import os
import glob

files = glob.glob('src/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        code = f.read()

    # Replacing opacities that break light mode visibility
    code = code.replace("bg-white/5", "bg-input")
    code = code.replace("bg-white/10", "bg-surface-hover")
    code = code.replace("border-white/10", "border-line")
    code = code.replace("border-white/20", "border-line-hover")
    
    with open(file, 'w') as f:
        f.write(code)

print("Fixed white opacities.")
