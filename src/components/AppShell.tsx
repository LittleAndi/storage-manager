import React from "react";
import { Sun, Moon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuthStore } from "../state/authStore";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const navLinks = [
  { href: "/", label: "Get Started" },
  { href: "/spaces", label: "Spaces" },
  { href: "/profile", label: "Profile" },
];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    toast.success("Logged out successfully");
    setLogoutDialogOpen(false);
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 bg-background text-foreground px-4 py-2 rounded shadow"
      >
        Skip to main content
      </a>
      <header className="bg-sidebar text-sidebar-foreground p-4 flex items-center justify-between border-b border-sidebar-border">
        <span className="font-bold text-lg">Storage Manager</span>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="h-10 w-10 p-0"
          >
            {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </Button>
          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatar_url || undefined}
                  alt={user.full_name || user.email}
                />
                <AvatarFallback>
                  {(user.full_name || user.email)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-sm font-semibold"
                aria-label="Logged in user name"
              >
                {user.full_name || user.email}
              </span>
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="md:hidden"
                aria-label="Open navigation menu"
                variant="ghost"
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-menu"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Storage Manager navigation
                </SheetDescription>
              </SheetHeader>
              <nav className="p-4">
                <ul className="space-y-2">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Button
                        asChild
                        variant={isActive(link.href) ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        <Link to={link.href}>{link.label}</Link>
                      </Button>
                    </li>
                  ))}
                  {user && (
                    <li>
                      <Button
                        onClick={() => setLogoutDialogOpen(true)}
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
        <aside className="hidden md:flex md:flex-col md:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4">
          <nav>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Button
                    asChild
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Link to={link.href}>{link.label}</Link>
                  </Button>
                </li>
              ))}
              {user && (
                <li>
                  <Button
                    onClick={() => setLogoutDialogOpen(true)}
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
        <main id="main-content" className="flex-1 p-4">{children}</main>
      </div>
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppShell;
