import re

with open('src/App.tsx', 'r') as f:
    app_code = f.read()

# 1. Extract AuthScreen
auth_match = re.search(r'// --- AUTHENTICATION VIEWS.*?const AuthScreen =.*?};\n', app_code, re.DOTALL)
auth_code = auth_match.group(0) if auth_match else ''

# 2. Extract Onboarding
onboarding_match = re.search(r'// --- ONBOARDING FLOW.*?const OnboardingStep3 =.*?};\n', app_code, re.DOTALL)
onboarding_code = onboarding_match.group(0) if onboarding_match else ''

# 3. Extract DashboardLayout
layout_match = re.search(r'// --- DASHBOARD LAYOUT ---.*?const DashboardLayout =.*?};\n', app_code, re.DOTALL)
layout_code = layout_match.group(0) if layout_match else ''

if not auth_code or not onboarding_code or not layout_code:
    print(f"FAILED TO MATCH: Auth: {bool(auth_code)}, Onboard: {bool(onboarding_code)}, Layout: {bool(layout_code)}")
    exit(1)

layout_code = re.sub(r'const SidebarItem =.*?};\n+', '', layout_code, flags=re.DOTALL)

with open('src/pages/AuthScreen.tsx', 'w') as f:
    f.write('''import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Eye, EyeOff } from 'lucide-react';
import { useData } from '../contexts/DataContext';

''' + auth_code + '''
export default AuthScreen;
''')

with open('src/pages/Onboarding.tsx', 'w') as f:
    f.write('''import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

''' + onboarding_code + '''
export { OnboardingStep1, OnboardingStep2, OnboardingStep3 };
''')

with open('src/layouts/DashboardLayout.tsx', 'w') as f:
    f.write('''import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Plus, Sun, Moon } from 'lucide-react';

''' + layout_code + '''
export default DashboardLayout;
''')

new_app = app_code.replace(auth_code, '')
new_app = new_app.replace(onboarding_code, '')
new_app = new_app.replace(layout_match.group(0), '')

imports = """
import AuthScreen from './pages/AuthScreen';
import { OnboardingStep1, OnboardingStep2, OnboardingStep3 } from './pages/Onboarding';
import DashboardLayout from './layouts/DashboardLayout';
"""

import_end = new_app.rfind("import React")
if import_end != -1:
    import_end = new_app.find("\n", import_end) + 1
    new_app = new_app[:import_end] + imports + new_app[import_end:]

with open('src/App.tsx', 'w') as f:
    f.write(new_app)

print("SUCCESS")
