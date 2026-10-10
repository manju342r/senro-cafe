const fs = require('fs');

const motion_imports = "import { motion } from 'framer-motion';\n";
const variants_code = `
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
`;

let file, code;

// CompareHub
file = 'src/components/CompareHub.tsx';
code = fs.readFileSync(file, 'utf-8');
if (!code.includes('framer-motion')) {
    code = code.replace("import React from 'react';", "import React from 'react';\n" + motion_imports);
    code = code.replace(/export const CompareHub = \(\) => \{/, "export const CompareHub = () => {" + variants_code);
    code = code.replace('<div className="max-w-6xl space-y-6">', '<motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-6">');
    code = code.replace(/<\/div>\s*\);\s*\};\s*$/, '</motion.div>\n  );\n};');
    code = code.replace(
        '<div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">',
        '<motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">'
    );
    code = code.replace(
        '</table>\n      </div>\n    </motion.div>',
        '</table>\n      </motion.div>\n    </motion.div>'
    );
    fs.writeFileSync(file, code);
}

// LiveSignals
file = 'src/components/LiveSignals.tsx';
code = fs.readFileSync(file, 'utf-8');
if (!code.includes('framer-motion')) {
    code = code.replace("import React from 'react';", "import React from 'react';\n" + motion_imports);
    code = code.replace(/export const LiveSignals = \(\) => \{/, "export const LiveSignals = () => {" + variants_code);
    code = code.replace('<div className="max-w-4xl mx-auto space-y-6">', '<motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">');
    code = code.replace(/<\/div>\s*\);\s*\};\s*$/, '</motion.div>\n  );\n};');
    code = code.replaceAll(
        '<div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex gap-4 transition-colors hover:border-zinc-700 shadow-lg group">',
        '<motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex gap-4 transition-colors hover:border-zinc-700 shadow-lg group">'
    );
    code = code.replaceAll(
        '</span>\n        </div>\n      </div>',
        '</span>\n        </div>\n      </motion.div>'
    );
    code = code.replace(
        '<div className="border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-24 text-center">',
        '<motion.div variants={itemVariants} className="border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-24 text-center">'
    );
    code = code.replace(
        'setup in Settings.</p>\n      </div>',
        'setup in Settings.</p>\n      </motion.div>'
    );
    fs.writeFileSync(file, code);
}

// BattlecardsList
file = 'src/components/BattlecardsList.tsx';
code = fs.readFileSync(file, 'utf-8');
if (!code.includes('framer-motion')) {
    code = code.replace("import React from 'react';", "import React from 'react';\n" + motion_imports);
    code = code.replace(/export const BattlecardsList = \(\) => \{/, "export const BattlecardsList = () => {" + variants_code);
    code = code.replace('<div className="max-w-6xl space-y-6">', '<motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-6">');
    code = code.replace(/<\/div>\s*\);\s*\};\s*$/, '</motion.div>\n  );\n};');
    code = code.replace(
        '<div className="bg-[#121212]/80 backdrop-blur-xl border border-blue-500/30 p-5 rounded-2xl max-w-2xl relative overflow-hidden">',
        '<motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-[#121212]/80 backdrop-blur-xl border border-blue-500/30 p-5 rounded-2xl max-w-2xl relative overflow-hidden">'
    );
    code = code.replace(
        'with your sales reps.</p>\n      </div>',
        'with your sales reps.</p>\n      </motion.div>'
    );
    code = code.replace(
        '<div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex justify-between items-center max-w-xl">',
        '<motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex justify-between items-center max-w-xl">'
    );
    code = code.replace(
        '</button>\n      </div>',
        '</button>\n      </motion.div>'
    );
    fs.writeFileSync(file, code);
}

// SettingsUI
file = 'src/components/SettingsUI.tsx';
code = fs.readFileSync(file, 'utf-8');
if (!code.includes('framer-motion')) {
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\n" + motion_imports);
    code = code.replace(/export const SettingsUI = \(\) => \{/, "export const SettingsUI = () => {" + variants_code);
    code = code.replace('<div className="max-w-4xl mx-auto space-y-6 pb-12">', '<motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6 pb-12">');
    code = code.replace(/<\/div>\s*\);\s*\};\s*$/, '</motion.div>\n  );\n};');
    code = code.replaceAll(
        '<div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">',
        '<motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">'
    );
    code = code.replaceAll(
        '</div>\n      </div>',
        '</div>\n      </motion.div>'
    );
    fs.writeFileSync(file, code);
}

// Profile
file = 'src/components/Profile.tsx';
code = fs.readFileSync(file, 'utf-8');
if (!code.includes('framer-motion')) {
    code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\n" + motion_imports);
    code = code.replace(/export const Profile = \(\) => \{/, "export const Profile = () => {" + variants_code);
    code = code.replace('<div className="max-w-3xl mx-auto space-y-6 pb-12">', '<motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-3xl mx-auto space-y-6 pb-12">');
    code = code.replace(/<\/div>\s*\);\s*\};\s*$/, '</motion.div>\n  );\n};');
    code = code.replaceAll(
        '<div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">',
        '<motion.div variants={itemVariants} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg">'
    );
    code = code.replaceAll(
        '</div>\n      </div>',
        '</div>\n      </motion.div>'
    );
    fs.writeFileSync(file, code);
}

console.log("Safe replacement complete.");
