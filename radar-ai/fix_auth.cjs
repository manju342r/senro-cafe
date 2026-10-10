const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Update AuthScreen login logic to check for URLs
const authOld = `      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('userEmail', email);
        navigate('/dashboard');
      }`;

const authNew = `      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('userEmail', email);
        if (!localStorage.getItem('compUrl') || !localStorage.getItem('ownUrl')) {
          navigate('/onboarding/step-1');
        } else {
          navigate('/dashboard');
        }
      }`;

code = code.replace(authOld, authNew);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed Auth routing.");
