with open('src/contexts/DataContext.tsx', 'r') as f:
    content = f.read()

import re
provider_code = """export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  // Sync Supabase user_metadata to localStorage on auth state change
  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.user_metadata) {
        const { ownUrl, compUrl } = session.user.user_metadata;
        if (ownUrl) localStorage.setItem('ownUrl', ownUrl);
        if (compUrl) localStorage.setItem('compUrl', compUrl);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
"""

content = content.replace("export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {", provider_code)

with open('src/contexts/DataContext.tsx', 'w') as f:
    f.write(content)
