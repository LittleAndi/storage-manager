import React from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../state/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    toast.success("Signed out");
    navigate("/auth");
  };

  return (
    <AppShell>
      <h1 className="text-xl font-semibold tracking-tight mb-5">Profile</h1>

      {user ? (
        <div className="flex flex-col gap-4 max-w-sm">
          {/* Identity card */}
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {(user.full_name || user.email)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-[15px] truncate">{user.full_name || user.email}</p>
              {user.full_name && (
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* Roles */}
          {user.roles && user.roles.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Roles</p>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((role, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{role}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sign out */}
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/50"
            onClick={() => setLogoutOpen(true)}
          >
            Sign out
          </Button>

          <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll need to sign in again to access your spaces.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: "destructive" })}
                  onClick={handleLogout}
                >
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not signed in.</p>
      )}
    </AppShell>
  );
};

export default Profile;
