import React from "react";
import AppShell from "../components/AppShell";
import { SpacesSection } from "../components/SpacesSection";
import { useSpacesStore } from "@/state/spacesStore";
import { useAuthStore } from "@/state/authStore";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

import { useNavigate } from "react-router-dom";

const Spaces: React.FC = () => {
  const spaces = useSpacesStore((state) => state.spaces);
  const membershipRoles = useSpacesStore((state) => state.membershipRoles);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const removeSpace = useSpacesStore((state) => state.removeSpace);
  const membershipCounts = useSpacesStore((state) => state.membershipCounts);
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const deletingSpace = spaces.find(s => s.id === deletingId);
  const ALL_LOCATIONS = "__ALL__";
  const [locationFilter, setLocationFilter] = React.useState<string>(ALL_LOCATIONS);
  const locations = React.useMemo(() => {
    const locs = spaces.map(s => s.location).filter((loc): loc is string => typeof loc === 'string' && loc.length > 0);
    return Array.from(new Set(locs)).sort((a, b) => a.localeCompare(b));
  }, [spaces]);
  const filteredSpaces = locationFilter !== ALL_LOCATIONS
  ? spaces.filter((s) => s.location === locationFilter)
  : spaces;
  
  // Loading state: spaces is undefined/null before fetchSpaces resolves
  // If spaces is undefined/null, or if a loading flag is set, show loading
  const isLoading = !Array.isArray(spaces) || (Array.isArray(spaces) && spaces.length === 0 && !deletingId && !locations.length);

  const { ownedSpaces, sharedSpaces } = React.useMemo(() => {
    const owned: typeof spaces = [];
    const shared: typeof spaces = [];
    const uid = currentUser?.id;
    filteredSpaces.forEach((s) => {
      if (uid && s.owner_id === uid) owned.push(s); else shared.push(s);
    });
    const sorter = (a: typeof spaces[number], b: typeof spaces[number]) => {
      if (!a.name) return 1; if (!b.name) return -1; return a.name.localeCompare(b.name);
    };
    owned.sort(sorter);
    shared.sort(sorter);
    return { ownedSpaces: owned, sharedSpaces: shared };
  }, [filteredSpaces, currentUser?.id]);

  React.useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  function handleDelete(id: string): void {
    removeSpace(id);
    setDeletingId(null);
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">Storage Spaces</h1>
      <div className="flex items-center gap-4 mb-4">
        <Button onClick={() => navigate('/spaces/new')} className="w-fit">
          + New Space
        </Button>
        {locations.length > 0 && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LOCATIONS}>All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex flex-col gap-6">
        {isLoading ? (
          <Spinner size={24} label="Loading spaces..." className="py-8" />
        ) : Array.isArray(spaces) && filteredSpaces.length === 0 ? (
          <div className="text-muted-foreground">No spaces found.</div>
        ) : (
          <>
      <SpacesSection
        title="Your Spaces"
        spaces={ownedSpaces.map(s => ({
          id: s.id,
          name: s.name,
          location: s.location,
          memberCount: (membershipCounts[s.id] || 0) + 1, // include owner
          owner: s.owner || undefined,
          thumbnailUrl: s.thumbnail_url,
          isShared: false,
          onOpen: () => navigate(`/spaces/${s.id}`)
        }))}
      />
      <SpacesSection
        title="Shared With You"
        spaces={sharedSpaces.map(s => ({
          id: s.id,
          name: s.name,
          location: s.location,
          memberCount: (membershipCounts[s.id] || 0) + (s.owner_id ? 1 : 0),
          owner: s.owner || undefined,
          thumbnailUrl: s.thumbnail_url,
          isShared: true,
          ownerName: s.owner || undefined,
          role: membershipRoles[s.id],
          onOpen: () => navigate(`/spaces/${s.id}`)
        }))}
      />
          </>
        )}
      </div>
      {/* Delete dialog mounted once */}
      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the space{" "}
              <span className="font-semibold">{deletingSpace?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={() => deletingId && handleDelete(deletingId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Spaces;
