import React from "react";
import AppShell from "../components/AppShell";
import ItemRow from "../components/ItemRow";

const BoxDetail: React.FC = () => (
  <AppShell>
    <h1 className="text-2xl font-bold mb-4">Box Detail</h1>
    {/* TODO: Items list */}
    <ItemRow id="1" name="Sample Item" />
  </AppShell>
);

export default BoxDetail;
