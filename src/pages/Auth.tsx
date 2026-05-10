import React from 'react';
import { supabase } from '../supabaseClient';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from '@/state/authStore';

const Auth: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectParam = React.useMemo(
    () => new URLSearchParams(location.search).get('redirect') || '/',
    [location.search]
  );
  const user = useAuthStore(s => s.user);

  React.useEffect(() => {
    if (redirectParam) {
      window.localStorage.setItem('post_auth_redirect', redirectParam);
    }
  }, [redirectParam]);

  React.useEffect(() => {
    if (user) {
      const pending = window.localStorage.getItem('post_auth_redirect') || '/';
      window.localStorage.removeItem('post_auth_redirect');
      navigate(pending === '/auth' ? '/' : pending, { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) alert('Google sign-in failed: ' + error.message);
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin },
    });
    if (error) alert('Facebook sign-in failed: ' + error.message);
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Storage Manager</p>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to organize your storage spaces</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <Button
            variant="outline"
            className="w-full gap-2.5 h-11"
            onClick={handleGoogleLogin}
            aria-label="Sign in with Google"
          >
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4 shrink-0"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.62 2.36 30.13 0 24 0 14.61 0 6.44 5.74 2.44 14.09l8.01 6.23C12.6 13.16 17.87 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.75H24v9.02h12.44c-.54 2.92-2.18 5.39-4.64 7.05l7.19 5.59C43.98 37.36 46.1 31.41 46.1 24.5z"/><path fill="#FBBC05" d="M10.45 28.32c-1.01-2.99-1.01-6.23 0-9.22l-8.01-6.23C.64 16.36 0 20.07 0 24c0 3.93.64 7.64 2.44 11.13l8.01-6.23z"/><path fill="#EA4335" d="M24 46c6.13 0 11.62-2.02 15.94-5.5l-7.19-5.59c-2.01 1.35-4.59 2.15-7.75 2.15-6.13 0-11.4-3.66-13.55-8.82l-8.01 6.23C6.44 42.26 14.61 48 24 48z"/></g></svg>
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2.5 h-11"
            onClick={handleFacebookLogin}
            aria-label="Sign in with Facebook"
          >
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4 shrink-0"><path fill="#1877F2" d="M24 0C10.745 0 0 10.745 0 24c0 12.02 8.805 21.92 20.205 23.74V31.09h-6.08v-7.09h6.08v-5.41c0-6.02 3.66-9.34 9.13-9.34 2.64 0 5.41.47 5.41.47v5.96h-3.05c-3.01 0-3.95 1.87-3.95 3.79v4.53h6.72l-1.07 7.09h-5.65v16.65C39.195 45.92 48 36.02 48 24 48 10.745 37.255 0 24 0z"/></svg>
            Continue with Facebook
          </Button>
        </div>

        <Alert variant="default" className="text-xs">
          <AlertTitle className="text-xs font-semibold">Note on OAuth redirect</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            We use Supabase for auth <span className="break-all">({supabaseUrl})</span>. On the free plan, OAuth redirects show a Supabase domain. This is expected and safe.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Auth;
