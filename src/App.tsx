
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import ScanQR from './pages/ScanQR';

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/invite" element={<InviteCollaborators />} />
        <Route path="/bulk" element={<BulkOperations />} />
        <Route path="/scan" element={<ScanQR />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
