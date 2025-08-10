import './style.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useAuthStore } from './state/authStore';
import { supabase } from './supabaseClient';

// Set up auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  const setUser = useAuthStore.getState().setUser;
  const setToken = useAuthStore.getState().setToken;
  if (session?.user) {
    // Map Supabase user to UserProfile
    setUser({
      id: session.user.id,
      name: session.user.user_metadata?.name || '',
      email: session.user.email || '',
      roles: [], // You can fetch roles from your backend if needed
    });
    setToken(session.access_token || '');
  } else {
    setUser(null as any);
    setToken(null as any);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
