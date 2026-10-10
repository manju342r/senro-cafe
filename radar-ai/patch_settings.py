with open('src/components/SettingsUI.tsx', 'r') as f:
    content = f.read()

import re

# Add useData import
if "import { useData }" not in content:
    content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { useData } from '../contexts/DataContext';")

# Add supabase to component
content = content.replace("const [compUrl, setCompUrl] = useState('');", "const [compUrl, setCompUrl] = useState('');\n  const { supabase } = useData();")

# Patch handleSaveWorkspace
old_save = """  const handleSaveWorkspace = () => {
    if (ownUrl) localStorage.setItem('ownUrl', ownUrl);
    if (compUrl) localStorage.setItem('compUrl', compUrl);
    alert("Workspace settings saved. Reloading to apply changes...");
    window.location.reload();
  };"""

new_save = """  const handleSaveWorkspace = async () => {
    if (ownUrl) localStorage.setItem('ownUrl', ownUrl);
    if (compUrl) localStorage.setItem('compUrl', compUrl);
    await supabase.auth.updateUser({ data: { ownUrl: ownUrl, compUrl: compUrl } });
    alert("Workspace settings saved. Reloading to apply changes...");
    window.location.reload();
  };"""

content = content.replace(old_save, new_save)

with open('src/components/SettingsUI.tsx', 'w') as f:
    f.write(content)

