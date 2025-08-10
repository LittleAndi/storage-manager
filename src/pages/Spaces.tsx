import React from "react";
import AppShell from "../components/AppShell";
import SpaceCard from "../components/SpaceCard";

const Spaces: React.FC = () => (
  <AppShell>
    <h1 className="text-2xl font-bold mb-4">Storage Spaces</h1>
    {/* TODO: List of spaces (owned + shared) */}
    <SpaceCard id="1" name="Sample Space" />
  </AppShell>
);

export default Spaces;
