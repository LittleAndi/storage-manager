import React from "react";
import AppShell from "../components/AppShell";
import { SpacesSection } from "../components/SpacesSection";
import { resolveImageUrl, getCachedImageUrl } from "@/lib/imageUrls";
import { useSpacesStore } from "@/state/spacesStore";
import { useAuthStore } from "@/state/authStore";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Spinner } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

const Spaces: React.FC = () => {
  const spaces = useSpacesStore((state) => state.spaces);
  const loading = useSpacesStore((state) => state.loading);
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
    const locs = spaces.map(s => s.location).filter((loc): loc is string => typeof loc === "string" && loc.length > 0);
    return Array.from(new Set(locs)).sort((a, b) => a.localeCompare(b));
  }, [spaces]);

  const filteredSpaces = locationFilter !== ALL_LOCATIONS
    ? spaces.filter((s) => s.location === locationFilter)
    : spaces;

  React.useEffect(() => {
    const ids = filteredSpaces.map(s => s.image_id).filter(Boolean) as string[];
    ids.forEach(id => resolveImageUrl(id));
  }, [filteredSpaces]);

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
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Spaces</h1>
        <Button size="sm" onClick={() => navigate("/spaces/new")}>
          + New Space
        </Button>
      </div>

      {/* Pill location filter */}
      {locations.length > 0 && (
        <div className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none mb-5">
          <div className="flex gap-1.5 min-w-max">
            {[{ value: ALL_LOCATIONS, label: "All" }, ...locations.map(l => ({ value: l, label: l }))].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLocationFilter(value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  locationFilter === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground/60 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-8">
        {loading ? (
          <Spinner size={24} label="Loading spaces..." className="py-8" />
        ) : spaces.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No spaces yet. Create your first space to get started.</p>
        ) : filteredSpaces.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No spaces match this location.</p>
        ) : (
          <>
            <SpacesSection
              title="Your Spaces"
              spaces={ownedSpaces.map(s => ({
                id: s.id,
                name: s.name,
                location: s.location,
                memberCount: (membershipCounts[s.id] || 0) + 1,
                boxCount: s.boxCount,
                owner: s.owner || undefined,
                thumbnailUrl: getCachedImageUrl(s.image_id) || undefined,
                imageId: s.image_id ?? undefined,
                isShared: false,
                onOpen: () => navigate(`/spaces/${s.id}`),
                onDelete: (s.boxCount ?? 0) === 0 ? () => setDeletingId(s.id) : undefined,
              }))}
            />
            <SpacesSection
              title="Shared With You"
              spaces={sharedSpaces.map(s => ({
                id: s.id,
                name: s.name,
                location: s.location,
                memberCount: (membershipCounts[s.id] || 0) + (s.owner_id ? 1 : 0),
                boxCount: s.boxCount,
                owner: s.owner || undefined,
                thumbnailUrl: getCachedImageUrl(s.image_id) || undefined,
                imageId: s.image_id ?? undefined,
                isShared: true,
                ownerName: s.owner || undefined,
                role: membershipRoles[s.id],
                onOpen: () => navigate(`/spaces/${s.id}`),
              }))}
            />
          </>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this space?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. This will permanently delete{" "}
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
