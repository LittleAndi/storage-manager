import React, { useEffect, useRef, useState } from "react";
import { resolveImageUrl, getCachedImageUrl } from "../lib/imageUrls"; // path relative to components directory
import ImagePlaceholder from "./ImagePlaceholder";

export interface BoxCardProps {
  id?: string; // optional (not currently used internally; retained for potential test ids)
  name: string;
  location?: string;
  itemCount?: number;
  /** Optional signed URL already known */
  thumbnailUrl?: string;
  /** Image id for lazy resolution */
  imageId?: string;
  onOpen?: () => void;
}

const BoxCard: React.FC<BoxCardProps> = ({ name, location, itemCount, thumbnailUrl, imageId, onOpen }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(() => (imageId ? getCachedImageUrl(imageId) || undefined : undefined));

  // Intersection observer to trigger load
  useEffect(() => {
    if (!imageId || thumbnailUrl) return; // nothing to lazy load
    if (resolvedUrl) return; // already have it
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { rootMargin: "100px" }, // pre-load slightly before visible
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [imageId, thumbnailUrl, resolvedUrl]);

  // Resolve URL once visible
  useEffect(() => {
    if (!visible) return;
    if (!imageId || resolvedUrl || thumbnailUrl) return;
    let cancelled = false;
    setLoading(true);
    resolveImageUrl(imageId)
      .catch(() => null)
      .then(url => {
        if (!cancelled) setResolvedUrl(url || undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, imageId, resolvedUrl, thumbnailUrl]);

  const finalUrl = thumbnailUrl || resolvedUrl;

  return (
    <button
      type="button"
      ref={ref}
      className="bg-card rounded shadow p-4 flex items-center cursor-pointer w-full text-left"
      onClick={onOpen}
      aria-label={`Open box ${name}`}
    >
      {finalUrl ? (
        <img src={finalUrl} alt={`${name} image`} className="w-12 h-12 rounded mr-4 object-cover" />
      ) : imageId ? (
        <ImagePlaceholder className="w-12 h-12 rounded mr-4" loading={loading} label="Loading image" />
      ) : (
        <ImagePlaceholder className="w-12 h-12 rounded mr-4" label="No image" />
      )}
      <div className="flex-1">
        <h3 className="text-base font-semibold">{name}</h3>
        {location && <p className="text-xs text-muted-foreground">{location}</p>}
        {typeof itemCount === "number" && (
          <p className="text-xs text-muted-foreground">Items: {itemCount}</p>
        )}
      </div>
    </button>
  );
};

export default BoxCard;
