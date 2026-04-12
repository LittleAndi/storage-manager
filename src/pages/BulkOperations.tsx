import React from "react";
import AppShell from "../components/AppShell";

const BulkOperations: React.FC = () => (
  <AppShell>
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 px-6">
      <div className="text-5xl" aria-hidden="true">📦</div>
      <h1 className="text-2xl font-bold text-balance">Bulk Operations</h1>
      <p className="text-muted-foreground max-w-sm">
        Select multiple boxes or items in a space to move, delete, export, or tag them all at once.
        This feature is coming soon.
      </p>
    </div>
  </AppShell>
);

export default BulkOperations;
