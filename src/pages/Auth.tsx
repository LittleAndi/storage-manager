import { supabase } from '../supabaseClient';

const Auth: React.FC = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Ensures redirect matches your deployed site
      },
    });
    if (error) {
      alert('Google sign-in failed: ' + error.message);
    }
  };
  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) {
      alert('Facebook sign-in failed: ' + error.message);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-2 text-center">Sign In / Sign Up</h1>
        <h2 className="text-1xl mb-6 text-center">Get started organizing your storage spaces</h2>
        <button
          className="w-full flex items-center justify-center gap-2 py-2 px-4 mb-4 border rounded bg-gray-100 hover:bg-gray-200"
          onClick={handleGoogleLogin}
          aria-label="Sign in with Google"
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.62 2.36 30.13 0 24 0 14.61 0 6.44 5.74 2.44 14.09l8.01 6.23C12.6 13.16 17.87 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.75H24v9.02h12.44c-.54 2.92-2.18 5.39-4.64 7.05l7.19 5.59C43.98 37.36 46.1 31.41 46.1 24.5z"/><path fill="#FBBC05" d="M10.45 28.32c-1.01-2.99-1.01-6.23 0-9.22l-8.01-6.23C.64 16.36 0 20.07 0 24c0 3.93.64 7.64 2.44 11.13l8.01-6.23z"/><path fill="#EA4335" d="M24 46c6.13 0 11.62-2.02 15.94-5.5l-7.19-5.59c-2.01 1.35-4.59 2.15-7.75 2.15-6.13 0-11.4-3.66-13.55-8.82l-8.01 6.23C6.44 42.26 14.61 48 24 48z"/></g></svg>
          Sign in with Google
        </button>
        <button
          className="w-full flex items-center justify-center gap-2 py-2 px-4 mb-4 border rounded bg-blue-100 hover:bg-blue-200 text-blue-900"
          onClick={handleFacebookLogin}
          aria-label="Sign in with Facebook"
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#1877F2" d="M24 0C10.745 0 0 10.745 0 24c0 12.02 8.805 21.92 20.205 23.74V31.09h-6.08v-7.09h6.08v-5.41c0-6.02 3.66-9.34 9.13-9.34 2.64 0 5.41.47 5.41.47v5.96h-3.05c-3.01 0-3.95 1.87-3.95 3.79v4.53h6.72l-1.07 7.09h-5.65v16.65C39.195 45.92 48 36.02 48 24 48 10.745 37.255 0 24 0z"/></svg>
          Sign in with Facebook
        </button>
      </div>
    </div>
  );
};

export default Auth;
