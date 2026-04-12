import './style.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './state/authStore';
import { supabase } from './supabaseClient';
import type { UserProfile } from "@/types/entities";
import { supabaseUserToUserProfile } from "./lib/mappers";
import AppSkeleton from "./components/AppSkeleton";

export function Root() {
  const [loading, setLoading] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    async function fetchSession() {
      const session = await supabase.auth.getSession();
      const supabaseUser = session?.data?.session?.user ?? null;
      const providerToken = session?.data?.session?.provider_token ?? null;
      let userProfile: UserProfile | null = null;
      if (supabaseUser) {
        userProfile = supabaseUserToUserProfile(supabaseUser);
      }
      setUser(userProfile);
      setToken(providerToken);
      setLoading(false);
    }
    fetchSession();
  }, [setUser, setToken]);

  if (loading) {
    return <AppSkeleton />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
