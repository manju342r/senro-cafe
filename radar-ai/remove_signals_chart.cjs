const fs = require('fs');
let code = fs.readFileSync('src/components/Overview.tsx', 'utf8');

// Remove mockCategoryData
code = code.replace(/const mockCategoryData = \[\s*\{ name: 'Pricing', value: 4 \},\s*\{ name: 'Features', value: 7 \},\s*\{ name: 'Hiring', value: 2 \},\s*\{ name: 'Messaging', value: 5 \},\s*\];/g, '');

// Remove BarChart imports
code = code.replace(/BarChart, Bar/g, '');

// Remove the Signals by Category block and make the timeline chart take full width (col-span-3 instead of col-span-2)
const chartBlockRegex = /<div className="bg-\[#121212\] border border-zinc-800 p-6 rounded-xl">\s*<h3 className="text-sm font-semibold text-zinc-300 mb-6">Signals by Category<\/h3>[\s\S]*?<\/BarChart>\s*<\/ResponsiveContainer>\s*<\/div>\s*<\/div>/g;

code = code.replace(chartBlockRegex, '');
code = code.replace('className="col-span-2 bg-[#121212] border border-zinc-800 p-6 rounded-xl"', 'className="col-span-3 bg-[#121212] border border-zinc-800 p-6 rounded-xl"');

fs.writeFileSync('src/components/Overview.tsx', code);
console.log('Removed Signals by Category');
