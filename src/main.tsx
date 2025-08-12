import './style.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useAuthStore } from './state/authStore';
import { supabase } from './supabaseClient';

function Root() {
  const [loading, setLoading] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    async function fetchSession() {
      const session = await supabase.auth.getSession();
      const supabaseUser = session?.data?.session?.user ?? null;
      const providerToken = session?.data?.session?.provider_token ?? null;
      let userProfile = null;
      if (supabaseUser) {
        userProfile = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
          email: supabaseUser.email || '',
          roles: [],
          avatarUrl: supabaseUser.user_metadata?.avatar_url || '',
        };
      }
      setUser(userProfile);
      setToken(providerToken);
      setLoading(false);
    }
    fetchSession();
  }, [setUser, setToken]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
