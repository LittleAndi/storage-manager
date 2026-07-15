import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const IconSpaces = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8h14M5 8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v.286A2 2 0 0 1 19 8m-14 0v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" />
  </svg>
);

const IconProfile = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" />
  </svg>
);

const navLinks = [
  { href: "/spaces", label: "Spaces", icon: <IconSpaces /> },
  { href: "/profile", label: "Profile", icon: <IconProfile /> },
];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/spaces" className="font-semibold text-[15px] tracking-tight text-primary flex-1">
            Storage Manager
          </Link>
          {user && (
            <Link to="/profile" aria-label="Your profile" className="flex items-center gap-2">
              <span className="text-sm text-foreground/60 hidden sm:inline truncate max-w-[140px]">
                {user.full_name || user.email}
              </span>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {(user.full_name || user.email)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </header>

      {/* Layout body */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-52 md:shrink-0 md:fixed md:top-14 md:left-0 md:bottom-0 md:z-30 bg-sidebar border-r border-sidebar-border md:overflow-y-auto">
          <nav className="p-3 flex flex-col gap-0.5" aria-label="Main navigation">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/65 hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0 md:ml-52">
          <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              to={link.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-16 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-foreground/45"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AppShell;
