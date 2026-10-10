const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsUI.tsx', 'utf8');

const regex = /<div className="flex justify-between items-center text-sm">\s*<span className="text-zinc-500 w-1\/3">Email report frequency<\/span>[\s\S]*?<\/select>\s*<\/div>/;
content = content.replace(regex, '');

fs.writeFileSync('src/components/SettingsUI.tsx', content);
