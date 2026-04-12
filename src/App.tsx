import React, { lazy, Suspense, type JSX } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './state/authStore';
import AppSkeleton from './components/AppSkeleton';
import { Toaster } from "@/components/ui/sonner";

const GetStarted = lazy(() => import('./pages/GetStarted'));
const Spaces = lazy(() => import('./pages/Spaces'));
const CreateSpace = lazy(() => import('./pages/CreateSpace'));
const SpaceDetail = lazy(() => import('./pages/SpaceDetail'));
const CreateBox = lazy(() => import('./pages/CreateBox'));
const BoxDetail = lazy(() => import('./pages/BoxDetail'));
const AddItem = lazy(() => import('./pages/AddItem'));
const ItemDetail = lazy(() => import('./pages/ItemDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Auth = lazy(() => import('./pages/Auth'));
const InviteCollaborators = lazy(() => import('./pages/InviteCollaborators'));
const BulkOperations = lazy(() => import('./pages/BulkOperations'));

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const isLoggedIn = !!user && typeof user.id === 'string' && user.id.length > 0;

  if (!isLoggedIn && !location.pathname.startsWith('/auth')) {
    const target = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/auth?redirect=${target}`} replace />;
  }
  return children;
}

function App() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const pending = window.localStorage.getItem('post_auth_redirect');
      if (pending && pending !== location.pathname) {
        window.localStorage.removeItem('post_auth_redirect');
        navigate(pending, { replace: true });
      }
    }
  }, [user, navigate, location.pathname]);

  return (
    <>
      <Toaster />
      <Suspense fallback={<AppSkeleton />}>
        <Routes>
        <Route path="/auth/*" element={<Auth />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Routes>
                <Route path="/" element={<GetStarted />} />
                <Route path="/spaces" element={<Spaces />} />
                <Route path="/spaces/new" element={<CreateSpace />} />
                <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
                <Route path="/spaces/:spaceId/boxes/new" element={<CreateBox />} />
                <Route path="/spaces/:spaceId/boxes/:boxId" element={<BoxDetail />} />
                <Route path="/spaces/:spaceId/boxes/:boxId/items/new" element={<AddItem />} />
                <Route path="/items/:itemId" element={<ItemDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/invite" element={<InviteCollaborators />} />
                <Route path="/bulk" element={<BulkOperations />} />
              </Routes>
            </RequireAuth>
          }
        />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;
