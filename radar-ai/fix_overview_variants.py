with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

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

content = content.replace("  const containerVariants = {\n    hidden: { opacity: 0 },\n    show: {\n      opacity: 1,\n      transition: { staggerChildren: 0.1 }\n    }\n  };", variants)

with open('src/components/Overview.tsx', 'w') as f:
    f.write(content)
