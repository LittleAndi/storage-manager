import React from "react";
import AppShell from "../components/AppShell";
import ScanScanner from "../components/ScanScanner";

const ScanQR: React.FC = () => (
  <AppShell>
    <h1 className="text-2xl font-bold mb-4">Scan QR</h1>
    <ScanScanner />
    {/* TODO: Route to box detail or preview */}
  </AppShell>
);

export default ScanQR;
