with open('old_overview.tsx', 'r') as f:
    old = f.read()

with open('src/components/Overview.tsx', 'r') as f:
    current = f.read()

# Grab the header block from old_overview.tsx
# From "export const Overview" up to "const [emailing, setEmailing] = useState(false);"
import re
match = re.search(r'(export const Overview = \(\) => \{.*?)(?=\s*const \[emailing, setEmailing\] = useState\(false\);)', old, re.DOTALL)
if match:
    header = match.group(1)
    
    # Now find where to insert it in current
    # It should go right after MetricCard definition
    idx = current.find('const [emailing, setEmailing] = useState(false);')
    if idx != -1:
        current = current[:idx] + header + current[idx:]
        with open('src/components/Overview.tsx', 'w') as f:
            f.write(current)
        print("Restored!")
    else:
        print("Could not find emailing state")
else:
    print("Could not find header in old")
