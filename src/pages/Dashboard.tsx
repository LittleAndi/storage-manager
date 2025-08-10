import React from "react";
import AppShell from "../components/AppShell";
import SpaceCard from "../components/SpaceCard";
import ActivityFeed from "../components/ActivityFeed";

const Dashboard: React.FC = () => (
  <AppShell>
    <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
    {/* TODO: Stats, recent activity, quick access */}
    <div className="mb-6">Recent Activity</div>
    <ActivityFeed activities={[]} />
    <div className="mt-6">Spaces</div>
    <SpaceCard id="1" name="Sample Space" />
  </AppShell>
);

export default Dashboard;
