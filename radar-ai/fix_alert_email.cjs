const fs = require('fs');
let code = fs.readFileSync('src/components/Overview.tsx', 'utf-8');
code = code.replace(
    'if (!compUrl) return alert("Please set a competitor URL first.");',
    'if (!compUrl) return alert("Please click \'+ Add Competitor\' at the top right to start tracking.");'
);
fs.writeFileSync('src/components/Overview.tsx', code);
console.log("Fixed email alert.");
