const fs = require('fs');
const glob = require('glob');

// Use sync glob to find all tsx files
const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Replace blue gradients with violet/fuchsia
  code = code.replaceAll('from-blue-500 to-indigo-600', 'from-violet-500 to-fuchsia-600');
  code = code.replaceAll('from-blue-400 to-blue-600', 'from-violet-400 to-violet-600');
  code = code.replaceAll('from-blue-600 to-indigo-600', 'from-violet-600 to-fuchsia-600');
  code = code.replaceAll('hover:from-blue-500 hover:to-indigo-500', 'hover:from-violet-500 hover:to-fuchsia-500');
  
  // Replace solid blues with violets
  code = code.replaceAll('bg-blue-600', 'bg-violet-600');
  code = code.replaceAll('hover:bg-blue-700', 'hover:bg-violet-700');
  code = code.replaceAll('text-blue-500', 'text-violet-500');
  code = code.replaceAll('text-blue-400', 'text-violet-400');
  code = code.replaceAll('bg-blue-500/10', 'bg-violet-500/10');
  code = code.replaceAll('bg-blue-500/20', 'bg-violet-500/20');
  code = code.replaceAll('bg-blue-500/30', 'bg-violet-500/30');
  code = code.replaceAll('border-blue-500', 'border-violet-500');
  code = code.replaceAll('border-blue-500/20', 'border-violet-500/20');
  code = code.replaceAll('border-blue-500/30', 'border-violet-500/30');
  code = code.replaceAll('border-blue-500/50', 'border-violet-500/50');
  code = code.replaceAll('focus:border-blue-500', 'focus:border-violet-500');
  code = code.replaceAll('focus:border-blue-500/50', 'focus:border-violet-500/50');
  code = code.replaceAll('ring-blue-500', 'ring-violet-500');
  code = code.replaceAll('ring-blue-500/10', 'ring-violet-500/10');
  code = code.replaceAll('ring-blue-500/30', 'ring-violet-500/30');
  code = code.replaceAll('ring-blue-400', 'ring-violet-400');
  code = code.replaceAll('shadow-blue-900', 'shadow-violet-900');
  
  // Also change the background radial gradient in index.css
  
  fs.writeFileSync(file, code);
});

let indexCss = fs.readFileSync('src/index.css', 'utf-8');
indexCss = indexCss.replace('rgba(37, 99, 235, 0.08)', 'rgba(139, 92, 246, 0.08)'); // blue to violet
indexCss = indexCss.replace('rgba(139, 92, 246, 0.08)', 'rgba(217, 70, 239, 0.08)'); // violet to fuchsia
fs.writeFileSync('src/index.css', indexCss);

console.log('Color scheme changed to Violet/Fuchsia Amethyst.');
