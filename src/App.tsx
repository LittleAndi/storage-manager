import { type JSX } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from './state/authStore';
import Dashboard from './pages/Dashboard';
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

  // Check for valid user profile (must have id)
  const isLoggedIn = !!user && typeof user.id === 'string' && user.id.length > 0;

  if (!isLoggedIn && !location.pathname.startsWith('/auth')) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/auth/*" element={<Auth />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
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
      </BrowserRouter>
    </>
  );
}

export default App;
