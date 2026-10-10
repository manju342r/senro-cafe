with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

import re

# Fix map closing
content = re.sub(
    r'(<span className="text-xs text-muted font-medium flex-shrink-0">\{sig\.time\}</span>\n\s*</motion\.div>\n\s*)\)\)}',
    r'\1);\n            })}',
    content
)

with open('src/components/Overview.tsx', 'w') as f:
    f.write(content)
