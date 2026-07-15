import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useSpacesStore } from "@/state/spacesStore";
import { TrashIcon } from "@/components/ui/trash-icon";
import { toast } from "sonner";
import { resolveImageUrl, getCachedImageUrl } from "@/lib/imageUrls";

export interface SpaceCardProps {
  id: string;
  name: string;
  location?: string;
  memberCount?: number;
  boxCount?: number;
  owner?: string | null;
  thumbnailUrl?: string;
  imageId?: string | null;
  onOpen?: () => void;
  isShared?: boolean;
  ownerName?: string;
  role?: string;
  onDelete?: () => void;
}

const SpaceCard: React.FC<SpaceCardProps> = ({
  name, location, memberCount, boxCount, thumbnailUrl, imageId,
  onOpen, isShared, ownerName, owner, role, onDelete,
}) => {
  const canDelete = (boxCount ?? 0) === 0;
  const setSpaceImageUrl = useSpacesStore((s) => s.setSpaceImageUrl);
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [erroredThumb, setErroredThumb] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(
    () => (imageId ? getCachedImageUrl(imageId) || undefined : undefined)
  );

  useEffect(() => {
    if (!imageId || thumbnailUrl || resolvedUrl) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [imageId, thumbnailUrl, resolvedUrl]);

  useEffect(() => {
    if (!imageId || resolvedUrl || thumbnailUrl || !visible) return;
    let cancelled = false;
    (async () => {
      setErroredThumb(false);
      try {
        const u = await resolveImageUrl(imageId);
        if (!cancelled && u) {
          setResolvedUrl(u);
          try { setSpaceImageUrl(imageId, u); } catch { /* ignore */ }
        }
      } catch {
        if (!cancelled) setErroredThumb(true);
      }
    })();
    return () => { cancelled = true; };
  }, [visible, imageId, resolvedUrl, thumbnailUrl, setSpaceImageUrl]);

  const finalUrl = thumbnailUrl || resolvedUrl;

  return (
    <div
      ref={ref}
      className="relative group flex flex-col rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(e) => e.target === e.currentTarget && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen?.())}
      aria-label={`Open space ${name}`}
      role="button"
    >
      {/* Image */}
      <div className="aspect-[4/3] w-full bg-muted overflow-hidden relative">
        {finalUrl && !erroredThumb ? (
          <img
            src={finalUrl}
            alt={`${name} image`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setErroredThumb(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/35">
            <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14M5 8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v.286A2 2 0 0 1 19 8m-14 0v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
            </svg>
          </div>
        )}
        {/* Delete button */}
        {!isShared && (
          canDelete && onDelete ? (
            <button
              type="button"
              className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-lg bg-card/90 border border-border text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-card"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label={`Delete space ${name}`}
            >
              <TrashIcon size={14} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toast.info("Remove all boxes before deleting this space."); }}
              className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-lg bg-card/60 border border-dashed border-muted-foreground/25 text-muted-foreground/35 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label="Cannot delete space (contains boxes)"
              aria-disabled="true"
            >
              <TrashIcon size={13} aria-hidden="true" />
            </button>
          )
        )}
        {/* Shared badge */}
        {isShared && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-card/85 text-foreground/70 rounded-full px-2 py-0.5 border border-border">
            Shared
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-0.5">
        <p className="font-semibold text-[14px] leading-snug line-clamp-1" title={name}>{name}</p>
        {location && <p className="text-xs text-muted-foreground line-clamp-1">{location}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {typeof boxCount === "number" && (
            <span className="text-xs text-muted-foreground">
              {boxCount} {boxCount === 1 ? "box" : "boxes"}
            </span>
          )}
          {typeof memberCount === "number" && memberCount > 1 && (
            <span className="text-xs text-muted-foreground">· {memberCount} members</span>
          )}
          {isShared && role && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide h-4 px-1.5">
              {role}
            </Badge>
          )}
        </div>
        {isShared && (ownerName || owner) && (
          <p className="text-xs text-muted-foreground/65 mt-0.5 truncate">By {ownerName || owner}</p>
        )}
      </div>
    </div>
  );
};

export default SpaceCard;
