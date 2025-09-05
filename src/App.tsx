import React, { type JSX } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './state/authStore';
import GetStarted from './pages/GetStarted';
import Spaces from './pages/Spaces';
import CreateSpace from './pages/CreateSpace';
import SpaceDetail from './pages/SpaceDetail';
import CreateBox from './pages/CreateBox';
import BoxDetail from './pages/BoxDetail';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import InviteCollaborators from './pages/InviteCollaborators';
import BulkOperations from './pages/BulkOperations';

import { Toaster } from "@/components/ui/sonner";


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
    </>
  );
}

export default App;
