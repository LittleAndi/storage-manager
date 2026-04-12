
import React from "react";
import AppShell from "../components/AppShell";
// import ItemRow from "../components/ItemRow";
import { useNavigate, useParams } from "react-router-dom";
import { useBoxesStore } from "@/state/boxesStore";
import EditBoxModal from "@/components/EditBoxModal";
import { Button } from "@/components/ui/button";
import { useSpacePermission } from "@/state/useSpacePermission";
import EditableTitle from "@/components/EditableTitle";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import { useSpacesStore } from "@/state/spacesStore";
import { getCachedImageUrl, resolveImageUrl } from "@/lib/imageUrls";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button-variants";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";

const BoxDetail: React.FC = () => {
  const { spaceId, boxId } = useParams();
  const navigate = useNavigate();
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const fetchBoxes = useBoxesStore((state) => state.fetchBoxes);
  const box = useBoxesStore(state => state.boxes.find(b => b.id === boxId));
  const removeBox = useBoxesStore(state => state.removeBox);
  const [editOpen, setEditOpen] = React.useState(false);
  const permission = useSpacePermission(spaceId || "");
  const { mutate: updateBoxName } = useEntityUpdate<{ name: string }>({ kind: "box", entity: box || { id: "__placeholder__", name: "", space_id: "__placeholder__" } });
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (!spaces || spaces.length === 0) {
      fetchSpaces();
    }    
    if (spaceId) fetchBoxes(spaceId);
  }, [spaces, spaceId, fetchSpaces, fetchBoxes]);


  // Cache stores both thumbnail & original; we request thumbnail for card, original for lightbox as needed
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(() => (box?.image_id ? (getCachedImageUrl(box.image_id, { variant: "thumbnail" }) || null) : null));
  const [fullUrl, setFullUrl] = React.useState<string | null>(() => (box?.image_id ? (getCachedImageUrl(box.image_id, { variant: "original" }) || null) : null));
  const [imgLoading, setImgLoading] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  // Resolve image URL if box has image_id and not cached
  React.useEffect(() => {
    let cancelled = false;
    if (!box?.image_id) {
      setThumbUrl(null);
      setFullUrl(null);
      return;
    }
    const cachedThumb = getCachedImageUrl(box.image_id, { variant: "thumbnail" });
    const cachedOrig = getCachedImageUrl(box.image_id, { variant: "original" });
    if (cachedThumb) setThumbUrl(cachedThumb);
    if (cachedOrig) setFullUrl(cachedOrig);
    if (cachedThumb && cachedOrig) return; // both cached
    setImgLoading(true);
    resolveImageUrl(box.image_id, { variant: "thumbnail" })
      .then(url => { if (!cancelled) setThumbUrl(url); })
      .catch(() => { if (!cancelled) setThumbUrl(null); })
      .finally(() => { if (!cancelled) setImgLoading(false); });
    return () => { cancelled = true; };
  }, [box?.image_id]);

  // Lazy load original when lightbox opens (if not already loaded)
  React.useEffect(() => {
    if (!lightboxOpen || !box?.image_id) return;
    if (fullUrl) return;
    resolveImageUrl(box.image_id, { variant: "original" })
      .then(url => { if (url) setFullUrl(url); })
      .catch(() => { /* ignore - keep thumbnail fallback */ });
  }, [lightboxOpen, box?.image_id, fullUrl]);

  if (!box) {
    return (
      <AppShell>
        <h1 className="text-2xl font-bold mb-4 text-balance">Box not found</h1>
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
      {(
        <div className="mb-6">
          <div className="mb-4">
            {box.image_id ? (
              thumbUrl ? (
                <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="group relative max-h-64 rounded border bg-card cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={thumbUrl}
                        alt={`${box.name} image`}
                        className="max-h-64 rounded object-contain w-full h-full"
                      />
                      <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white text-xs font-medium group-hover:flex">Click to enlarge</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="p-2 bg-background/95 backdrop-blur max-w-[min(95vw,1100px)] max-h-[95svh] flex flex-col items-center justify-center">
                    <DialogTitle className="sr-only">{box.name} image</DialogTitle>
                    <DialogDescription className="sr-only">Full size preview of the box image. Press Escape or the close button to exit.</DialogDescription>
                    <DialogClose aria-label="Close" className="right-2 top-2">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                    </DialogClose>
                    <img
                      src={fullUrl || thumbUrl || undefined}
                      alt={`${box.name} full size image`}
                      className="max-h-[90svh] max-w-full object-contain rounded shadow-md"
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <ImagePlaceholder className="h-40 w-40 rounded" loading={imgLoading} />
              )
            ) : (
              <ImagePlaceholder className="h-40 w-40 rounded" />
            )}
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
