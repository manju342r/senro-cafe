const fs = require('fs');
let content = fs.readFileSync('src/components/Profile.tsx', 'utf8');

const changePasswordLogic = `
  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert('Password reset link has been sent to your email address!');
    } catch (e: any) {
      alert('Error sending password reset: ' + e.message);
    }
  };

  const handleSignOut = async () => {`;

content = content.replace(
  `  const handleSignOut = async () => {`,
  changePasswordLogic
);

const buttonsUI = `
          <div className="pt-6 border-t border-zinc-800/50 flex flex-col gap-3">
            <button onClick={handlePasswordReset} className="flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
              Change password via Email
            </button>
            <button onClick={handleSignOut} className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
              <LogOut size={16} /> Sign out of Senro.AI
            </button>
          </div>`;

content = content.replace(
  `          <div className="pt-6 border-t border-zinc-800/50">
            <button onClick={handleSignOut} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <LogOut size={16} /> Sign out of Senro.AI
            </button>
          </div>`,
  buttonsUI
);

fs.writeFileSync('src/components/Profile.tsx', content);
