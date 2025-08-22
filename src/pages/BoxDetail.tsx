
import React from "react";
import AppShell from "../components/AppShell";
// import ItemRow from "../components/ItemRow";
import { useParams } from "react-router-dom";
import { useBoxesStore } from "@/state/boxesStore";
import { useSpacesStore } from "@/state/spacesStore";

const BoxDetail: React.FC = () => {
  const { spaceId, boxId } = useParams();
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const fetchBoxes = useBoxesStore((state) => state.fetchBoxes);
  const box = useBoxesStore(state => state.boxes.find(b => b.id === boxId));

  React.useEffect(() => {
    if (!spaces || spaces.length === 0) {
      fetchSpaces();
    }    
    if (spaceId) fetchBoxes(spaceId);
  }, [spaces, spaceId, fetchSpaces, fetchBoxes]);


  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">Box Detail</h1>
      {box ? (
        <div className="mb-6">
          <div className="mb-2"><span className="font-semibold">Name:</span> {box.name}</div>
          <div className="mb-2"><span className="font-semibold">Location:</span> {box.location || <span className="text-muted-foreground">(none)</span>}</div>
          <div className="mb-2"><span className="font-semibold">Content:</span><br />
            <div className="whitespace-pre-line border rounded p-2 bg-muted">{box.content || <span className="text-muted-foreground">(none)</span>}</div>
          </div>
          <div className="mb-2"><span className="font-semibold">Created:</span> {box.created_at ? new Date(box.created_at).toLocaleString() : <span className="text-muted-foreground">(unknown)</span>}</div>
          <div className="mb-2"><span className="font-semibold">Modified:</span> {box.modified_at ? new Date(box.modified_at).toLocaleString() : <span className="text-muted-foreground">(unknown)</span>}</div>
        </div>
      ) : (
        <div className="text-destructive">Box not found.</div>
      )}
      {/* TODO: Items list */}
      {/* <ItemRow id="1" name="Sample Item" /> */}
    </AppShell>
  );
};

export default BoxDetail;
