import { useParams } from "react-router-dom";
import { useSpacesStore } from "@/state/spacesStore";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell";
import MemberList from "../components/MemberList";

const SpaceDetail: React.FC = () => {
  const { spaceId } = useParams();
  const space = useSpacesStore((state) => state.spaces.find(s => s.id === spaceId));
  const navigate = useNavigate();

  if (!space) {
    return (
      <AppShell>
        <h1 className="text-2xl font-bold mb-4">Space not found</h1>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        className="mb-4 px-4 py-2 rounded bg-primary text-primary-foreground shadow-sm flex items-center gap-2 w-fit"
        onClick={() => navigate('/spaces')}
        aria-label="Back to spaces"
      >
        <span aria-hidden="true">←</span> <span>Back to Spaces</span>
      </button>
      <h1 className="text-2xl font-bold mb-4">{space.name}</h1>
      <div className="mb-2 text-muted-foreground">Location: {space.location}</div>
      <div className="mb-2 text-muted-foreground">Owner: {space.owner}</div>
      <div className="mb-2 text-muted-foreground">Members: {space.memberCount}</div>
      {space.thumbnailUrl && (
        <img src={space.thumbnailUrl} alt={space.name} className="w-32 h-32 rounded mb-4" />
      )}
      {/* TODO: Members, boxes list, map */}
      <MemberList members={[]} />
      {/* TODO: List boxes for this space */}
    </AppShell>
  );
};

export default SpaceDetail;
