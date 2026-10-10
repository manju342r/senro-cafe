import os

replacements = {
    "text-violet-400": "text-brand-mint",
    "text-fuchsia-400": "text-brand-emerald",
    "stroke=\"#8b5cf6\"": "stroke=\"#09663f\"",
    "stopColor=\"#8b5cf6\"": "stopColor=\"#09663f\"",
    "stopColor=\"#d946ef\"": "stopColor=\"#5bc59a\"",
    "border-violet-500/20": "border-brand-emerald/20",
    "from-violet-500/10": "from-brand-emerald/10",
    "to-fuchsia-500/10": "to-brand-mint/10"
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

