import AppShell from "../components/AppShell";
import SpaceCard from "../components/SpaceCard";
import { useSpacesStore } from "@/state/spacesStore";

const Spaces: React.FC = () => {
  const spaces = useSpacesStore((state) => state.spaces);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">Storage Spaces</h1>
      <div className="grid gap-4">
        {spaces.length === 0 ? (
          <div className="text-muted-foreground">No spaces found.</div>
        ) : (
          spaces.map((space) => (
            <SpaceCard key={space.id} {...space} />
          ))
        )}
      </div>
    </AppShell>
  );
};

export default Spaces;
