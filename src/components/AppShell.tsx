import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetHeader } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuthStore } from '../state/authStore';
import { supabase } from '../supabaseClient';

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/spaces", label: "Spaces" },
  { href: "/profile", label: "Profile" },
  { href: "/bulk", label: "Bulk Operations" },
  { href: "/scan", label: "Scan QR" },
];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    toast.success("Logged out successfully");
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <span className="font-bold text-lg">Storage Manager</span>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                <AvatarFallback>{(user.full_name || user.email)?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold" aria-label="Logged in user name">{user.full_name || user.email}</span>
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="md:hidden"
                aria-label="Open navigation menu"
                variant="ghost"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">Storage Manager navigation</SheetDescription>
              </SheetHeader>
              <nav className="p-4">
                <ul className="space-y-2">
                  {navLinks.map(link => (
                    <li key={link.href}>
                      <a href={link.href} className="block px-3 text-gray-900 hover:bg-gray-100 rounded">{link.label}</a>
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
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="flex flex-1">
        {/* Desktop sidebar */}
  <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-lg p-4">
          <nav>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href} className="block py-2 px-3 rounded hover:bg-gray-200 text-gray-900">{link.label}</a>
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
