import React from "react";
import AppShell from "../components/AppShell";
import MemberList from "../components/MemberList";
import BoxCard from "../components/BoxCard";

const SpaceDetail: React.FC = () => (
  <AppShell>
    <h1 className="text-2xl font-bold mb-4">Space Detail</h1>
    {/* TODO: Members, boxes list, map */}
    <MemberList members={[]} />
    <BoxCard id="1" name="Sample Box" />
  </AppShell>
);

export default SpaceDetail;
