const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace DashboardLayout container
code = code.replace(
  'className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex font-sans"',
  'className="min-h-screen bg-transparent text-zinc-200 flex font-sans selection:bg-blue-500/30"'
);

// Replace Sidebar
code = code.replace(
  '<aside className="w-64 bg-[#121212] border-r border-zinc-800 flex flex-col justify-between">',
  '<aside className="w-64 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between relative z-20 shadow-2xl">'
);

// Replace Sidebar Item
code = code.replace(
  /className=\{`flex items-center gap-3 px-3 py-2\.5 rounded-lg text-sm font-medium transition-all \$\{.*?`\}/g,
  `className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 \${isActive ? 'bg-blue-500/10 text-blue-400 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}\`}`
);

// Replace header
code = code.replace(
  '<header className="h-16 border-b border-zinc-800 bg-[#0a0a0a] px-6 flex justify-between items-center shrink-0">',
  '<header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 flex justify-between items-center shrink-0 sticky top-0 z-10">'
);

// Replace search input
code = code.replace(
  'className="w-full bg-[#121212] border border-zinc-800 text-sm text-zinc-200 rounded-md pl-9 pr-4 py-1.5 focus:border-blue-500 focus:outline-none"',
  'className="w-full bg-white/5 border border-white/10 text-sm text-zinc-200 rounded-xl pl-9 pr-4 py-2 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all backdrop-blur-md"'
);

// Add logo glow
code = code.replace(
  '<div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center">',
  '<div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">'
);
code = code.replace(
  '<h1 className="text-lg font-bold text-zinc-100 tracking-wide">Senro.AI</h1>',
  '<h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 tracking-tight">Senro.AI</h1>'
);

// Button styling
code = code.replace(
  'className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"',
  'className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transform hover:-translate-y-0.5"'
);

// Profile circle
code = code.replace(
  'className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"',
  'className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:ring-4 hover:ring-blue-500/30 transition-all shadow-lg"'
);

// Add competitor modal background
code = code.replace(
  '<div className="bg-[#121212] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">',
  '<div className="bg-[#0f0f13]/90 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden ring-1 ring-white/5">'
);
code = code.replace(
  '<div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#0a0a0a]">',
  '<div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">'
);
code = code.replace(
  'className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"',
  'className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-inner"'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx upgraded with luxurious styling.');
