const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The original import in App.tsx might not have been "import { LayoutDashboard"
// Let's replace the lucide-react import
code = code.replace(/import \{([^}]+)\} from 'lucide-react';/g, (match, group) => {
    if (!group.includes('Sun')) {
        return `import {${group}, Sun, Moon} from 'lucide-react';`;
    }
    return match;
});

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed imports");
