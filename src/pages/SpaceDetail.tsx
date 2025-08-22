import { useParams } from "react-router-dom";
import { useSpacesStore } from "@/state/spacesStore";
import { useBoxesStore } from "@/state/boxesStore";
import { useNavigate } from "react-router-dom";

import React from "react";
import AppShell from "../components/AppShell";
// import MemberList from "../components/MemberList";
import CreateBoxModal from "../components/CreateBoxModal";
import BoxCard from "../components/BoxCard";

const SpaceDetail: React.FC = () => {
  const { spaceId } = useParams();
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const space = useSpacesStore((state) => state.spaces.find(s => s.id === spaceId));
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = React.useState(false);
  const boxes = useBoxesStore((state) => state.boxes);
  const fetchBoxes = useBoxesStore((state) => state.fetchBoxes);

  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  React.useEffect(() => {
    if (!spaces || spaces.length === 0) {
      fetchSpaces();
    }    
    if (spaceId) fetchBoxes(spaceId);
  }, [spaces, spaceId, fetchSpaces, fetchBoxes]);

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
      {space.thumbnail_url && (
        <img src={space.thumbnail_url} alt={space.name} className="w-32 h-32 rounded mb-4" />
      )}
      <div className="mb-4">
        <button
          ref={triggerButtonRef}
          className="px-4 py-2 rounded bg-secondary text-secondary-foreground shadow-sm"
          onClick={handleOpenModal}
        >
          + Create Box
        </button>
      </div>
      <CreateBoxModal open={modalOpen} onClose={handleCloseModal} />
      {/* TODO: Members, boxes list, map */}
      {/* <MemberList members={[]} /> */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Boxes</h2>
        {boxes.length === 0 ? (
          <div className="text-muted-foreground">No boxes yet.</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {boxes.map(box => (
              <BoxCard
                key={box.id}
                id={box.id}
                name={box.name}
                location={box.location}
                // itemCount={box.itemCount}
                thumbnailUrl={box.thumbnail_url}
                onOpen={() => navigate(`/spaces/${spaceId}/boxes/${box.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default SpaceDetail;
