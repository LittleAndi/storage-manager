import React from "react";

/**
 * Branded skeleton shown during app initialisation and route-level Suspense.
 * Mimics the AppShell chrome so the layout feels stable before content arrives.
 */
const AppSkeleton: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading Storage Manager"
    className="min-h-dvh flex flex-col bg-background"
  >
    {/* nav bar */}
    <header className="h-14 border-b border-border flex items-center px-6 gap-4 shrink-0">
      <div className="h-5 w-32 rounded bg-muted animate-pulse" />
      <div className="flex-1" />
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    </header>

    {/* content area */}
    <main className="flex-1 flex flex-col items-center justify-start px-6 pt-10 gap-6 max-w-2xl mx-auto w-full">
      {/* page heading */}
      <div className="h-7 w-48 rounded bg-muted animate-pulse self-start" />

      {/* card row */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
          >
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse opacity-70" />
          </div>
        ))}
      </div>
    </main>

    <span className="sr-only">Loading Storage Manager…</span>
  </div>
);

export default AppSkeleton;
