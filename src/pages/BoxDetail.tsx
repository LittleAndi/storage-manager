
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
import { getCachedImageUrl, resolveImageUrl } from "@/lib/imageUrls";
import ImagePlaceholder from "@/components/ImagePlaceholder";

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


  const [imageUrl, setImageUrl] = React.useState<string | null>(() => (box?.image_id ? (getCachedImageUrl(box.image_id) || null) : null));
  const [imgLoading, setImgLoading] = React.useState(false);

  // Resolve image URL if box has image_id and not cached
  React.useEffect(() => {
    let cancelled = false;
    if (!box?.image_id) {
      setImageUrl(null);
      return;
    }
    const cached = getCachedImageUrl(box.image_id);
    if (cached) {
      setImageUrl(cached);
      return;
    }
    setImgLoading(true);
    resolveImageUrl(box.image_id)
      .then(url => { if (!cancelled) setImageUrl(url); })
      .catch(() => { if (!cancelled) setImageUrl(null); })
      .finally(() => { if (!cancelled) setImgLoading(false); });
    return () => { cancelled = true; };
  }, [box?.image_id]);

  if (!box) {
    return (
      <AppShell>
        <h1 className="text-2xl font-bold mb-4">Box not found</h1>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-2 w-fit"
        onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = `/spaces/${spaceId}`)}
        aria-label="Back to space"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/><path d="M21 12H9"/></svg>
        <span>Back to Space</span>
      </Button>
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <EditableTitle 
          value={box.name}
          canEdit={permission.canEdit}
          onSave={async (name) => updateBoxName({ name })}
          className="flex-1"
        />
        {permission.canEdit && (
          <Button variant="outline" onClick={() => setEditOpen(true)} aria-label="Edit box">Edit Box</Button>
        )}
      </div>
      {(
        <div className="mb-6">
          <div className="mb-4">
            <div className="font-semibold mb-1">Image:</div>
            {box.image_id ? (
              imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${box.name} image`}
                  className="max-h-64 rounded border object-contain bg-white"
                />
              ) : (
                <ImagePlaceholder className="h-40 w-40 rounded" loading={imgLoading} />
              )
            ) : (
              <ImagePlaceholder className="h-40 w-40 rounded" />
            )}
          </div>
          <div className="mb-2 flex items-center gap-2"><span className="font-semibold">Name:</span>
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
