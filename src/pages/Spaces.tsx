import React from "react";
import AppShell from "../components/AppShell";
import SpaceCard from "../components/SpaceCard";
import { useSpacesStore } from "@/state/spacesStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useNavigate } from "react-router-dom";

const Spaces: React.FC = () => {
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const removeSpace = useSpacesStore((state) => state.removeSpace);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const ALL_LOCATIONS = "__ALL__";
  const [locationFilter, setLocationFilter] = React.useState<string>(ALL_LOCATIONS);
  const locations = React.useMemo(() => {
  const locs = spaces.map(s => s.location).filter((loc): loc is string => typeof loc === 'string' && loc.length > 0);
  return Array.from(new Set(locs)).sort((a, b) => a.localeCompare(b));
  }, [spaces]);
  const filteredSpaces = locationFilter !== ALL_LOCATIONS
    ? spaces.filter((s) => s.location === locationFilter)
    : spaces;

  const orderedSpaces = React.useMemo(() => {
    return [...filteredSpaces].sort((a, b) => {
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredSpaces]);

  React.useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

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
      <div className="grid gap-4">
        {filteredSpaces.length === 0 ? (
          <div className="text-muted-foreground">No spaces found.</div>
        ) : (
          orderedSpaces.map((space: typeof spaces[number]) => (
            <div key={space.id} className="relative">
              <SpaceCard
                {...space}
                onOpen={() => navigate(`/spaces/${space.id}`)}
              />
              <button
                className="absolute top-2 right-2 p-2 rounded-full bg-transparent text-destructive hover:bg-muted transition"
                title="Delete space"
                aria-label="Delete space"
                onClick={() => setDeletingId(space.id)}
              >
                {/* Waste basket icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h10" />
                </svg>
              </button>
              {deletingId === space.id && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
                    <h2 className="text-lg font-bold mb-2">Delete Space?</h2>
                    <p className="mb-4">Are you sure you want to delete <span className="font-semibold">{space.name}</span>? This action cannot be undone.</p>
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-4 py-2 rounded bg-muted text-muted-foreground"
                        onClick={() => setDeletingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-destructive text-destructive-foreground font-bold"
                        onClick={() => {
                          removeSpace(space.id);
                          setDeletingId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
};

export default Spaces;
