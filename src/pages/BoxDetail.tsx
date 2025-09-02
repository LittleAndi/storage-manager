
import React from "react";
import AppShell from "../components/AppShell";
// import ItemRow from "../components/ItemRow";
import { useParams } from "react-router-dom";
import { useBoxesStore } from "@/state/boxesStore";
import EditBoxModal from "@/components/EditBoxModal";
import { Button } from "@/components/ui/button";
import { useSpacePermission } from "@/state/useSpacePermission";
import EditableTitle from "@/components/EditableTitle";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import { useSpacesStore } from "@/state/spacesStore";

const BoxDetail: React.FC = () => {
  const { spaceId, boxId } = useParams();
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const fetchBoxes = useBoxesStore((state) => state.fetchBoxes);
  const box = useBoxesStore(state => state.boxes.find(b => b.id === boxId));
  const [editOpen, setEditOpen] = React.useState(false);
  const permission = useSpacePermission(spaceId || "");
  const { mutate: updateBoxName } = useEntityUpdate<{ name: string }>({ kind: "box", entity: box || { id: "__placeholder__", name: "", space_id: "__placeholder__" } });

  React.useEffect(() => {
    if (!spaces || spaces.length === 0) {
      fetchSpaces();
    }    
    if (spaceId) fetchBoxes(spaceId);
  }, [spaces, spaceId, fetchSpaces, fetchBoxes]);


  if (!box) {
    return (
      <AppShell>
        <h1 className="text-2xl font-bold mb-4">Box not found</h1>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <h1 className="text-2xl font-bold">Box Detail</h1>
        {permission.canEdit && (
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>Edit Box</Button>
        )}
      </div>
      {(
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2"><span className="font-semibold">Name:</span>
            <EditableTitle value={box.name} canEdit={permission.canEdit} onSave={async (name) => updateBoxName({ name })} />
          </div>
          <div className="mb-2"><span className="font-semibold">Location:</span> {box.location || <span className="text-muted-foreground">(none)</span>}</div>
          <div className="mb-2"><span className="font-semibold">Content:</span><br />
            <div className="whitespace-pre-line border rounded p-2 bg-muted">{box.content || <span className="text-muted-foreground">(none)</span>}</div>
          </div>
          <div className="mb-2"><span className="font-semibold">Created:</span> {box.created_at ? new Date(box.created_at).toLocaleString() : <span className="text-muted-foreground">(unknown)</span>}</div>
          <div className="mb-2"><span className="font-semibold">Modified:</span> {box.modified_at ? new Date(box.modified_at).toLocaleString() : <span className="text-muted-foreground">(unknown)</span>}</div>
        </div>
      )}
      <EditBoxModal open={editOpen} onClose={() => setEditOpen(false)} box={box} />
      {/* TODO: Items list */}
      {/* <ItemRow id="1" name="Sample Item" /> */}
    </AppShell>
  );
};

export default BoxDetail;
