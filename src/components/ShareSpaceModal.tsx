import React, { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/supabaseClient";
import { useAuthStore } from "@/state/authStore";
import { toast } from "sonner";

/**
 * ShareSpaceModal
 * Allows an owner to add another existing user (by email) to a space.
 * Uses the Postgres function `add_space_member` so that email->user resolution and
 * permission enforcement happen securely in the database layer.
 */
interface ShareSpaceModalProps {
  open: boolean;
  onClose: () => void;
  spaceId: string;
  defaultRole?: "viewer" | "editor";
  onShared?: (data: { email: string; role: string; userId: string }) => void;
}

const roleOptions = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
];

export const ShareSpaceModal: React.FC<ShareSpaceModalProps> = ({ open, onClose, spaceId, defaultRole = "viewer", onShared }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(defaultRole);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail("");
    setRole(defaultRole);
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return; // prevent accidental close while submitting
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      toast.error("You must be signed in.");
      return;
    }
    if (currentUser.email?.toLowerCase() === trimmed) {
      toast.info("That's you already.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("add_space_member", {
        p_member_role: role,
        p_space_id: spaceId,
        p_user_email: trimmed,
      });
      if (error) {
        // Common constraint error patterns
        if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
          toast.info("User already a member.");
        } else if (error.message.toLowerCase().includes("not found")) {
          toast.error("No user with that email.");
        } else if (error.message.toLowerCase().includes("permission")) {
          toast.error("You don't have permission to share this space.");
        } else {
          toast.error("Share failed: " + error.message);
        }
        setLoading(false);
        return;
      }
      if (data) {
        toast.success("Space shared.");
        onShared?.({ email: trimmed, role, userId: "" });
        handleClose();
      } else {
        toast.error("Could not share space (unexpected response).");
        setLoading(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Unexpected error: " + msg);
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Share Space</AlertDialogTitle>
          <AlertDialogDescription>Invite an existing user by email and assign a role.</AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="share-email" className="block text-sm font-medium mb-1">User Email</label>
            <Input
              id="share-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              aria-label="Invite user email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="share-role" className="block text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v)}>
              <SelectTrigger id="share-role" className="w-full justify-between">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Sharing..." : "Share"}</Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ShareSpaceModal;
