import os
import glob

files = glob.glob('src/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        code = f.read()

    code = code.replace("text-zinc-600", "text-muted")
    code = code.replace("text-zinc-700", "text-muted")
    code = code.replace("hover:text-zinc-300", "hover:text-content")
    
    with open(file, 'w') as f:
        f.write(code)

print("Fixed lingering text-zinc.")
