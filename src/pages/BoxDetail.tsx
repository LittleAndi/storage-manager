import React from "react";
import AppShell from "../components/AppShell";
import { useNavigate, useParams } from "react-router-dom";
import { useBoxesStore } from "@/state/boxesStore";
import EditBoxModal from "@/components/EditBoxModal";
import { Button } from "@/components/ui/button";
import { useSpacePermission } from "@/state/useSpacePermission";
import EditableTitle from "@/components/EditableTitle";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import { useSpacesStore } from "@/state/spacesStore";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button-variants";
import { ImageGallery } from "@/components/ImageGallery";
import { getPrimaryImageId } from "@/lib/imageRefs";

const BoxDetail: React.FC = () => {
  const { spaceId, boxId } = useParams();
  const navigate = useNavigate();
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const fetchBoxes = useBoxesStore((state) => state.fetchBoxes);
  const box = useBoxesStore((state) => state.boxes.find((b) => b.id === boxId));
  const removeBox = useBoxesStore((state) => state.removeBox);
  const [editOpen, setEditOpen] = React.useState(false);
  const permission = useSpacePermission(spaceId || "");
  const { mutate: updateBoxName } = useEntityUpdate<{ name: string }>({
    kind: "box",
    entity: box || { id: "__placeholder__", name: "", space_id: "__placeholder__" },
  });
  const [confirmOpen, setConfirmOpen] = React.useState(false);

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

  const imageIds = box.image_ids || (getPrimaryImageId(box) ? [getPrimaryImageId(box)!] : []);

  return (
    <AppShell>
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-2 w-fit"
        onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = `/spaces/${spaceId}`))}
        aria-label="Back to space"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /><path d="M21 12H9" /></svg>
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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setEditOpen(true)} aria-label="Edit box">Edit Box</Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" aria-label="Delete box">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this box?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The box and its metadata will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={async () => {
                      if (!boxId) return;
                      await removeBox(boxId);
                      navigate(`/spaces/${spaceId}`);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <div className="mb-6">
        <ImageGallery title={`${box.name} images`} imageIds={imageIds} />
      </div>
      <div className="mb-4 text-sm">
        <span className="text-muted-foreground">Location:</span>{" "}
        {box.location || <span className="text-muted-foreground/60">(none)</span>}
      </div>
      <div className="mb-4">
        <p className="text-muted-foreground text-sm mb-1">Content</p>
        <div className="whitespace-pre-line rounded-lg border border-border bg-muted/40 p-3 text-sm">{box.content || <span className="text-muted-foreground/60">(none)</span>}</div>
      </div>
      <div className="flex gap-6 text-xs text-muted-foreground">
        <span>Created: {box.created_at ? new Date(box.created_at).toLocaleString() : <span className="opacity-60">(unknown)</span>}</span>
        <span>Modified: {box.modified_at ? new Date(box.modified_at).toLocaleString() : <span className="opacity-60">(unknown)</span>}</span>
      </div>
      <EditBoxModal open={editOpen} onClose={() => setEditOpen(false)} box={box} />
    </AppShell>
  );
};

export default BoxDetail;
