import { useParams } from "react-router-dom";
import { useSpacesStore } from "@/state/spacesStore";
import { useBoxesStore } from "@/state/boxesStore";
import { useNavigate } from "react-router-dom";

import React from "react";
import AppShell from "../components/AppShell";
import BoxCard from "../components/BoxCard";
import { LabelSheet } from "../components/LabelSheet";
import { MemberList } from "@/components/MemberList";
import CreateBoxModal from "../components/CreateBoxModal";
import ShareSpaceModal from "@/components/ShareSpaceModal";

import './SpaceDetail.css';
import { Button } from "@/components/ui/button";

const SpaceDetail: React.FC = () => {
  const { spaceId } = useParams();
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const space = useSpacesStore((state) => state.spaces.find(s => s.id === spaceId));
  const navigate = useNavigate();

  const [createBoxOpen, setCreateBoxOpen] = React.useState(false);
  const [shareSpaceOpen, setShareSpaceOpen] = React.useState(false);
  const boxes = useBoxesStore((state) => state.boxes);
  const fetchBoxes = useBoxesStore((state) => state.fetchBoxes);

  const createBoxButtonRef = React.useRef<HTMLButtonElement>(null);
  const [showLabelSheet, setShowLabelSheet] = React.useState(false);

  const openCreateBox = () => setCreateBoxOpen(true);
  const closeCreateBox = () => setCreateBoxOpen(false);
  const openShareSpace = () => setShareSpaceOpen(true);
  const closeShareSpace = () => setShareSpaceOpen(false);

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
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-2 w-fit"
        onClick={() => navigate('/spaces')}
        aria-label="Back to spaces"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/><path d="M21 12H9"/></svg>
        <span>Back to Spaces</span>
      </Button>
      <h1 className="text-2xl font-bold mb-4">{space.name}</h1>
      <div className="mb-2 text-muted-foreground">Location: {space.location}</div>
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-1">Members</h2>
        <MemberList
          spaceId={space.id}
          ownerId={space.owner_id}
          ownerName={space.owner}
        />
      </div>
      {space.thumbnail_url && (
        <img src={space.thumbnail_url} alt={space.name} className="w-32 h-32 rounded mb-4" />
      )}
      <div className="mb-4 flex gap-2 flex-wrap">
        <Button
          ref={createBoxButtonRef}
          variant="secondary"
          onClick={openCreateBox}
        >
          + Create Box
        </Button>
        <Button
          variant="ghost"
          onClick={openShareSpace}
          className="gap-2"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51L8.59 10.49"/></svg>
          <span>Share Space</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowLabelSheet(v => !v)}
          aria-pressed={showLabelSheet}
        >
          {showLabelSheet ? (
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>View Boxes</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13.59V3H10.41L3 10.41l9.59 9.59L20 13.59Z" />
                <circle cx="15" cy="9" r="1.25" />
              </svg>
              <span>View Labels</span>
            </span>
          )}
        </Button>
      </div>
      <CreateBoxModal open={createBoxOpen} onClose={closeCreateBox} />
      <ShareSpaceModal open={shareSpaceOpen} onClose={closeShareSpace} spaceId={space.id} />
      
      {!showLabelSheet ? (
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
      ) : (
        <div className="mt-6">
          <div className="flex items-center mb-2">
            <h2 className="text-lg font-semibold">Label Sheet</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.print();
              }}
              className="gap-2 ml-40"
              aria-label="Print labels"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
              <span>Print Labels</span>
            </Button>
          </div>
          <div className="print-area">
            <LabelSheet boxes={boxes} spaceId={spaceId} />
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default SpaceDetail;
