import re

with open('full_old_app.tsx', 'r') as f:
    code = f.read()

# Grab AuthScreen using a better regex that matches from const AuthScreen up to the end of the AuthScreen return block.
# Looking at the code, it ends right before `// --- ONBOARDING FLOW ---` or `const OnboardingLayout`
match = re.search(r'const AuthScreen =.*?};\n\n// --- ONBOARDING FLOW ---', code, re.DOTALL)
if match:
    auth_component = match.group(0).replace('// --- ONBOARDING FLOW ---', '')
    
    with open('src/pages/AuthScreen.tsx', 'w') as f:
        f.write('''import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Eye, EyeOff } from 'lucide-react';
import { useData } from '../contexts/DataContext';

''' + auth_component + '''
export default AuthScreen;
''')
    print("Restored AuthScreen!")
else:
    print("Match failed")
