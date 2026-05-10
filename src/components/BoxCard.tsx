import React, { useEffect, useRef, useState } from "react";
import { resolveImageUrl, getCachedImageUrl } from "../lib/imageUrls";

export interface BoxCardProps {
  id?: string;
  name: string;
  location?: string;
  itemCount?: number;
  thumbnailUrl?: string;
  imageId?: string;
  onOpen?: () => void;
}

const BoxCard: React.FC<BoxCardProps> = ({ name, location, itemCount, thumbnailUrl, imageId, onOpen }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(
    () => (imageId ? getCachedImageUrl(imageId) || undefined : undefined)
  );

  useEffect(() => {
    if (!imageId || thumbnailUrl || resolvedUrl) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { rootMargin: "100px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [imageId, thumbnailUrl, resolvedUrl]);

  useEffect(() => {
    if (!visible || !imageId || resolvedUrl || thumbnailUrl) return;
    let cancelled = false;
    resolveImageUrl(imageId)
      .catch(() => null)
      .then((url) => { if (!cancelled) setResolvedUrl(url || undefined); });
    return () => { cancelled = true; };
  }, [visible, imageId, resolvedUrl, thumbnailUrl]);

  const finalUrl = thumbnailUrl || resolvedUrl;

  return (
    <div
      ref={ref}
      className="relative group flex flex-col rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
      aria-label={`Open box ${name}`}
      role="button"
    >
      {/* Image */}
      <div className="aspect-[3/2] w-full bg-muted overflow-hidden">
        {finalUrl ? (
          <img src={finalUrl} alt={`${name} image`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-0.5">
        <p className="font-semibold text-[14px] leading-snug line-clamp-1" title={name}>{name}</p>
        {location && <p className="text-xs text-muted-foreground line-clamp-1">{location}</p>}
        {typeof itemCount === "number" && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        )}
      </div>
    </div>
  );
};

export default BoxCard;
