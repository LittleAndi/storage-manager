import React, { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSpacesStore } from "@/state/spacesStore";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/trash-icon";
import { resolveImageUrl, getCachedImageUrl } from "@/lib/imageUrls";

export interface SpaceCardProps {
  id: string;
  name: string;
  location?: string;
  memberCount?: number;
  boxCount?: number;
  owner?: string | null;
  /** Optional signed URL already known (e.g., recently uploaded) */
  thumbnailUrl?: string;
  /** optional persisted image id (UUID) for server-side stored thumbnails */
  imageId?: string | null;
  onOpen?: () => void;
  /** Indicates space is not owned by current user */
  isShared?: boolean;
  /** Owner display name (tooltip) */
  ownerName?: string;
  /** Current user's membership role when shared */
  role?: string;
  /** Delete handler (only for owned spaces) */
  onDelete?: () => void;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ name, location, memberCount, boxCount, owner, thumbnailUrl, imageId, onOpen, isShared, ownerName, role, onDelete }) => {
  const canDelete = (boxCount ?? 0) === 0;
  const setSpaceImageUrl = useSpacesStore((s) => s.setSpaceImageUrl);
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [erroredThumb, setErroredThumb] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(() => (imageId ? getCachedImageUrl(imageId) || undefined : undefined));

  // Observe visibility for lazy load (skip if thumbnailUrl already provided)
  useEffect(() => {
    if (!imageId || thumbnailUrl) return;
    if (resolvedUrl) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && setVisible(true));
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [imageId, thumbnailUrl, resolvedUrl]);

  // Resolve when visible
  useEffect(() => {
    if (!imageId || resolvedUrl || thumbnailUrl) return;
    if (!visible) return;
  let cancelled = false;
    setErroredThumb(false);
    resolveImageUrl(imageId)
      .then((u) => {
        if (!cancelled && u) {
          setResolvedUrl(u);
          try { setSpaceImageUrl(imageId, u); } catch { /* ignore */ }
        }
      })
      .catch(() => { if (!cancelled) setErroredThumb(true); })
  .finally(() => { /* no-op */ });
    return () => { cancelled = true; };
  }, [visible, imageId, resolvedUrl, thumbnailUrl, setSpaceImageUrl]);

  const finalUrl = thumbnailUrl || resolvedUrl;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={`relative group bg-white rounded shadow p-4 flex items-center cursor-pointer transition-colors ${
        isShared ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-background hover:bg-accent/50"
      }`}
      onClick={onOpen}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onOpen) { e.preventDefault(); onOpen(); } }}
      aria-label={`Open space ${name}`}
    >
      {!isShared && (
        canDelete && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-7 w-7 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete space ${name}`}
          >
            <TrashIcon size={16} aria-hidden="true" />
          </Button>
        ) : (
          <button
            type="button"
            className="absolute top-2 right-2 h-7 w-7 p-0 flex items-center justify-center rounded border border-dashed text-muted-foreground text-[10px] opacity-40 cursor-not-allowed"
            aria-label="Cannot delete space (contains boxes)"
            title="Remove all boxes before deleting this space"
            disabled
          >
            <TrashIcon size={14} aria-hidden="true" />
          </button>
        )
      )}
      {/* Render resolved image when available and not errored, otherwise show placeholder (150x150). */}
      {finalUrl && !erroredThumb ? (
        <img
          src={finalUrl}
          alt={`${name} image`}
          className="w-16 h-16 rounded object-cover mr-4 border"
          loading="lazy"
          onError={() => setErroredThumb(true)}
        />
      ) : (
        <img
          src={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='18'>No image</text></svg>`}
          alt=""
          aria-hidden="true"
          className="w-16 h-16 rounded object-cover mr-4 border"
          loading="lazy"
        />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {isShared && (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white"
              title={`Owned by ${ownerName || owner || "another user"}`}
            >
              <Users size={14} />
            </span>
          )}
          <span className="font-medium line-clamp-1" title={name}>{name}</span>
          {typeof boxCount === "number" && (
            <Badge variant="secondary" className="ml-1">
              {boxCount} {boxCount === 1 ? "box" : "boxes"}
            </Badge>
          )}
        </div>
        {isShared && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">Shared</Badge>
            {role && (
              <Badge variant="secondary" title={`Your role: ${role}`} className="uppercase tracking-wide text-[10px]">
                {role}
              </Badge>
            )}
          </div>
        )}
        {location && <p className="text-sm text-muted-foreground mt-1">{location}</p>}
        <p className="text-xs text-gray-400 mt-1">Members: {memberCount ?? 0} {owner && (`| Owner: ${owner}`)}</p>
        {boxCount && boxCount > 0 && (
          <p className="hidden non-empty-hint-touch mt-1 text-[11px] text-muted-foreground">
            Remove boxes to delete.
          </p>
        )}
      </div>
    </div>
  );
};

export default SpaceCard;
