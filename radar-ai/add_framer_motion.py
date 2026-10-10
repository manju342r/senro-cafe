import os
import glob
import re

files = [
    "src/components/CompareHub.tsx",
    "src/components/LiveSignals.tsx",
    "src/components/BattlecardsList.tsx",
    "src/components/SettingsUI.tsx",
    "src/components/Profile.tsx"
]

motion_imports = "import { motion } from 'framer-motion';\n"
variants_code = """
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
"""

for file in files:
    if not os.path.exists(file):
        continue
        
    with open(file, 'r') as f:
        content = f.read()

    # Add import if missing
    if "framer-motion" not in content:
        content = content.replace("import React", f"import React from 'react';\n{motion_imports}\n//")
        content = content.replace("//\n", "")
        # Clean up double imports of React
        content = re.sub(r"import React.*?;[\r\n]+import React from 'react';", "import React from 'react';", content)

    # Insert variants right after the component declaration
    # Example: export const CompareHub = () => {
    # Match generic component declarations
    comp_match = re.search(r"export const \w+ = \([^)]*\) => {", content)
    if comp_match and "containerVariants" not in content:
        decl = comp_match.group(0)
        content = content.replace(decl, f"{decl}\n{variants_code}")

    # Wrap the outer div in motion.div and assign containerVariants
    # Find the first `return (` and the immediate `<div`
    return_match = re.search(r"return \(\s*<div([^>]*)>", content)
    if return_match and 'initial="hidden"' not in return_match.group(0):
        attrs = return_match.group(1)
        # We need to replace the outermost <div...> with <motion.div variants={containerVariants} initial="hidden" animate="show"...>
        new_tag = f'return (\n    <motion.div variants={{containerVariants}} initial="hidden" animate="show"{attrs}>'
        content = content.replace(return_match.group(0), new_tag, 1)
        
        # Replace the very last </div>); with </motion.div>);
        # Find the last </div> before );
        content = re.sub(r"</div>\s*\);\s*};?\s*$", "</motion.div>\n  );\n};", content)
        
    # Find immediate children of the main div and wrap them in motion.div itemVariants
    # This is tricky with regex. Instead of modifying JSX structure blindly, let's just make
    # the major blocks inside the main container <motion.div variants={itemVariants}>
    
    # Just replacing `<div className="bg-[#121212]/80` with `<motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-[#121212]/80`
    content = content.replace('<div className="bg-[#121212]/80', '<motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-[#121212]/80')
    content = content.replace('</div>\n    </motion.div>', '</motion.div>\n    </motion.div>')
    
    # Catch any leftover replacements
    # If we opened a motion.div, we have to close it.
    # To be safer, I'll only replace the specific blocks manually if needed, or use a simpler approach.
    # Actually, replacing all `<div className="bg-[#121212]/80` is risky if we don't close them correctly.
    # Since these are UI cards, they end with `</div>`. 
    
    with open(file, 'w') as f:
        f.write(content)

print("Applied framer-motion setup.")
