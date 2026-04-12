import { useParams } from "react-router-dom";
import { useSpacesStore } from "@/state/spacesStore";
import { resolveImageUrl, getCachedImageUrl } from "@/lib/imageUrls";
import ImagePlaceholder from "@/components/ImagePlaceholder";
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
import EditSpaceModal from "@/components/EditSpaceModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button-variants";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useSpacePermission } from "@/state/useSpacePermission";
import EditableTitle from "@/components/EditableTitle";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";

const SpaceDetail: React.FC = () => {
  const { spaceId } = useParams();
  const spaces = useSpacesStore((state) => state.spaces);
  const fetchSpaces = useSpacesStore((state) => state.fetchSpaces);
  const space = useSpacesStore((state) => state.spaces.find(s => s.id === spaceId));
  const navigate = useNavigate();

  const [createBoxOpen, setCreateBoxOpen] = React.useState(false);
  const [shareSpaceOpen, setShareSpaceOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const boxes = useBoxesStore((state) => state.boxes);
  const fetchBoxes = useBoxesStore((state) => state.fetchBoxes);

  const createBoxButtonRef = React.useRef<HTMLButtonElement>(null);
  const removeSpace = useSpacesStore(state => state.removeSpace);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [showLabelSheet, setShowLabelSheet] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(() => (space?.image_id ? (getCachedImageUrl(space.image_id, { variant: "thumbnail" }) || null) : null));
  const [fullUrl, setFullUrl] = React.useState<string | null>(() => (space?.image_id ? (getCachedImageUrl(space.image_id, { variant: "original" }) || null) : null));
  const [spaceImgLoading, setSpaceImgLoading] = React.useState(false);

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

  // Resolve space image (mirrors BoxDetail logic) and update local state
  React.useEffect(() => {
    let cancelled = false;
    if (!space?.image_id) {
      setThumbUrl(null);
      setFullUrl(null);
      return;
    }
    const cachedThumb = getCachedImageUrl(space.image_id, { variant: "thumbnail" });
    const cachedOrig = getCachedImageUrl(space.image_id, { variant: "original" });
    if (cachedThumb) setThumbUrl(cachedThumb);
    if (cachedOrig) setFullUrl(cachedOrig);
    if (cachedThumb && cachedOrig) return;
    setSpaceImgLoading(true);
    resolveImageUrl(space.image_id, { variant: "thumbnail" })
      .then(url => { if (!cancelled) setThumbUrl(url); })
      .catch(() => { if (!cancelled) setThumbUrl(null); })
      .finally(() => { if (!cancelled) setSpaceImgLoading(false); });
    return () => { cancelled = true; };
  }, [space?.image_id]);

  // Fetch original lazily when lightbox opens
  React.useEffect(() => {
    if (!lightboxOpen || !space?.image_id) return;
    if (fullUrl) return;
    resolveImageUrl(space.image_id, { variant: "original" })
      .then(u => { if (u) setFullUrl(u); })
      .catch(() => { /* ignore */ });
  }, [lightboxOpen, space?.image_id, fullUrl]);

  const permission = useSpacePermission(spaceId || "");
  // Always call hooks first
  const { mutate: updateName } = useEntityUpdate<{ name: string }>({ kind: "space", entity: space || { id: "__placeholder__", name: "", owner_id: "", location: "" } });

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
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <EditableTitle
          value={space.name}
          canEdit={permission.canEdit}
          onSave={async (name) => updateName({ name })}
          className="flex-1"
        />
        {permission.canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setEditOpen(true)} aria-label="Edit space">
              Edit Space
            </Button>
            {permission.isOwner && (
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    aria-label="Delete space"
                    disabled={boxes.some(b => b.space_id === space.id)}
                    title={boxes.some(b => b.space_id === space.id) ? "Remove or move all boxes before deleting the space" : undefined}
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this space?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the space and its metadata. You can only delete a space that has no boxes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className={buttonVariants({ variant: "destructive" })}
                      onClick={async () => {
                        if (!spaceId) return;
                        await removeSpace(spaceId);
                        navigate('/spaces');
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>
      <div className="mb-2 text-muted-foreground">Location: {space.location}</div>
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-1">Members</h2>
        <MemberList spaceId={space.id} />
      </div>
      {space.image_id && (
        thumbUrl ? (
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group relative w-32 h-32 rounded mb-4 border bg-card cursor-zoom-in overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={thumbUrl}
                  alt={`${space.name} image`}
                  className="w-full h-full object-contain"
                />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white text-[10px] font-medium group-hover:flex">Click to enlarge</span>
              </button>
            </DialogTrigger>
            <DialogContent className="p-2 bg-background/95 backdrop-blur max-w-[min(95vw,1100px)] max-h-[95svh] flex flex-col items-center justify-center">
              <DialogTitle className="sr-only">{space.name} image</DialogTitle>
              <DialogDescription className="sr-only">Full size preview of the space image. Press Escape or the close button to exit.</DialogDescription>
              <DialogClose aria-label="Close" className="right-2 top-2">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </DialogClose>
              <img
                src={fullUrl || thumbUrl || undefined}
                alt={`${space.name} full size image`}
                className="max-h-[90svh] max-w-full object-contain rounded shadow-md"
              />
            </DialogContent>
          </Dialog>
        ) : (
          <ImagePlaceholder className="w-32 h-32 rounded mb-4" loading={spaceImgLoading} />
        )
      )}
      <div className="mb-4 flex gap-2 flex-wrap">
        <Button
          ref={createBoxButtonRef}
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
  <EditSpaceModal open={editOpen} onClose={() => setEditOpen(false)} space={space} />
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
                  name={box.name}
                  location={box.location}
                  imageId={box.image_id}
                  thumbnailUrl={box.image_id ? getCachedImageUrl(box.image_id) : undefined}
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
