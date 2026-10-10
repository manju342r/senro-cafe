const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const forgotPasswordLogic = `
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Error sending password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {`;

content = content.replace(
  `  const handleSubmit = async (e: React.FormEvent) => {`,
  forgotPasswordLogic
);

const forgotPasswordUI = `
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          
          {isLogin && (
            <div className="flex justify-end mt-1">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button `;

content = content.replace(
  `          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <button `,
  forgotPasswordUI
);

fs.writeFileSync('src/App.tsx', content);
