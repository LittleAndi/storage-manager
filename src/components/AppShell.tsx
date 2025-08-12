
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from '../state/authStore';
import { supabase } from '../supabaseClient';

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/spaces", label: "Spaces" },
  { href: "/spaces/new", label: "New Space" },
  { href: "/profile", label: "Profile" },
  { href: "/bulk", label: "Bulk Operations" },
  { href: "/scan", label: "Scan QR" },
];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <span className="font-bold text-lg">Storage Manager</span>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm font-semibold" aria-label="Logged in user name">{user.name || user.email}</span>
          )}
          <Button
            className="md:hidden px-3 py-2 rounded bg-gray-800"
            aria-label="Open navigation menu"
            onClick={() => setSidebarOpen(true)}
            variant="ghost"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </Button>
        </div>
      </header>
      <div className="flex flex-1">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}
        <aside
          className={`fixed z-50 top-0 left-0 h-full w-64 bg-white shadow-lg p-4 flex flex-col justify-between transform transition-transform duration-200 md:static md:translate-x-0 md:block ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Sidebar navigation"
        >
          <nav>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href} className="block py-2 px-3 rounded hover:bg-gray-200 text-gray-900" onClick={() => setSidebarOpen(false)}>{link.label}</a>
                </li>
              ))}
              {user && (
                <li>
                  <Button
                    onClick={handleLogout}
                    aria-label="Logout"
                    variant="destructive"
                    className="w-full mt-8"
                  >
                    Logout
                  </Button>
                </li>
              )}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:ml-64">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
