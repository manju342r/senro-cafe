with open('src/components/BattlecardsList.tsx', 'r') as f:
    content = f.read()

import re

pattern = r'<motion\.div whileHover=\{\{ y: -4 \}\} className="bg-surface/80 backdrop-blur-xl border border-line hover:border-brand-emerald/30 p-6 rounded-2xl flex flex-col justify-between shadow-lg transition-colors group">.*?</motion\.div>\s+<motion\.div whileHover=\{\{ y: -4 \}\}'

replacement = r"""<motion.div whileHover={{ y: -4 }}"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/BattlecardsList.tsx', 'w') as f:
    f.write(content)
