with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

import re
# Remove containerVariants and itemVariants from wherever they are inside Overview
content = re.sub(r'  const containerVariants = \{.*?\n  \};\n', '', content, flags=re.DOTALL)
content = re.sub(r'  const itemVariants = \{.*?\n  \};\n', '', content, flags=re.DOTALL)

variants = """
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
};
"""

content = content.replace("const MetricCard", variants + "\nconst MetricCard")

with open('src/components/Overview.tsx', 'w') as f:
    f.write(content)
