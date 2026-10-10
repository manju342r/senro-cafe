with open('src/pages/Onboarding.tsx', 'r') as f:
    content = f.read()

# For Step 1
content = content.replace("const [url, setUrl] = useState('');", "const [url, setUrl] = useState('');\n  const { supabase } = useData();")
content = content.replace("if(url) localStorage.setItem('ownUrl', url);\n        navigate('/onboarding/step-2');", """
        if(url) {
          localStorage.setItem('ownUrl', url);
          supabase.auth.updateUser({ data: { ownUrl: url } }).then(() => {
            navigate('/onboarding/step-2');
          });
        } else {
          navigate('/onboarding/step-2');
        }
""")

# For Step 2
content = content.replace("const [compUrl, setCompUrl] = useState('');", "const [compUrl, setCompUrl] = useState('');\n  const { supabase } = useData();")

step2_submit_old = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(compUrl) localStorage.setItem('compUrl', compUrl);
    setLoading(true);
    try {
      const res = await fetch('/api/config-status');
      const data = await res.json();
      if (data.configured) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/step-3');
      }
    } catch (err) {
      console.error(err);
      navigate('/onboarding/step-3'); // fallback
    }
  };"""

step2_submit_new = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(compUrl) {
      localStorage.setItem('compUrl', compUrl);
      await supabase.auth.updateUser({ data: { compUrl: compUrl } });
    }
    setLoading(true);
    try {
      const res = await fetch('/api/config-status');
      const data = await res.json();
      if (data.configured) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/step-3');
      }
    } catch (err) {
      console.error(err);
      navigate('/onboarding/step-3'); // fallback
    }
  };"""

content = content.replace(step2_submit_old, step2_submit_new)

# Add useData import
if "import { useData }" not in content:
    content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { useData } from '../contexts/DataContext';")


with open('src/pages/Onboarding.tsx', 'w') as f:
    f.write(content)

