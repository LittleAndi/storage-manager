import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { getCachedImageUrl, prefetchImageUrls, resolveImageUrl } from "@/lib/imageUrls";

interface ImageGalleryProps {
    imageIds: string[];
    title: string;
    emptyLabel?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
    imageIds,
    title,
    emptyLabel = "No images yet.",
}) => {
    const imageIdsKey = imageIds.join("|");
    const imageIdsRef = React.useRef(imageIds);
    imageIdsRef.current = imageIds;
    const [activeImageId, setActiveImageId] = React.useState<string | null>(
        imageIds[0] ?? null,
    );
    const [lightboxOpen, setLightboxOpen] = React.useState(false);
    const [previewUrls, setPreviewUrls] = React.useState<Record<string, string>>({});
    const [originalUrls, setOriginalUrls] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        const currentImageIds = imageIdsRef.current;
        if (!currentImageIds.length) {
            setActiveImageId(null);
            setPreviewUrls({});
            setOriginalUrls({});
            return;
        }
        if (!activeImageId || !currentImageIds.includes(activeImageId)) {
            setActiveImageId(currentImageIds[0]);
        }
    }, [imageIdsKey, activeImageId]);

    React.useEffect(() => {
        let cancelled = false;
        async function sync() {
            const currentImageIds = imageIdsRef.current;
            if (!currentImageIds.length) return;
            try {
                const thumbs = await prefetchImageUrls(currentImageIds, { variant: "thumbnail" });
                if (cancelled) return;
                setPreviewUrls((current) => ({ ...current, ...thumbs }));
            } catch (e) {
                console.warn("ImageGallery: failed to prefetch thumbnails", e);
            }
        }
        void sync();
        return () => {
            cancelled = true;
        };
    }, [imageIdsKey]);

    React.useEffect(() => {
        if (!lightboxOpen || !activeImageId) return;
        if (originalUrls[activeImageId]) return;
        let cancelled = false;
        resolveImageUrl(activeImageId, { variant: "original" })
            .then((url) => {
                if (cancelled || !url) return;
                setOriginalUrls((current) => ({ ...current, [activeImageId]: url }));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [lightboxOpen, activeImageId, originalUrls]);

    if (!imageIds.length) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                {emptyLabel}
            </div>
        );
    }

    const activeSrc = activeImageId
        ? originalUrls[activeImageId] || previewUrls[activeImageId] || getCachedImageUrl(activeImageId, { variant: "thumbnail" })
        : undefined;

    return (
        <div className="space-y-3">
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="group relative block w-full overflow-hidden rounded-xl border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {activeSrc ? (
                            <img
                                src={activeSrc}
                                alt={title}
                                className="max-h-[28rem] w-full object-contain"
                            />
                        ) : (
                            <div className="flex min-h-56 items-center justify-center text-muted-foreground">
                                Loading preview...
                            </div>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-black/40 px-3 py-2 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Click to enlarge
                        </span>
                    </button>
                </DialogTrigger>
                <DialogContent className="p-2 bg-background/95 backdrop-blur max-w-[min(95vw,1100px)] max-h-[95svh] flex flex-col items-center justify-center">
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Full size preview of the selected image. Press Escape or the close button to exit.
                    </DialogDescription>
                    <DialogClose aria-label="Close" className="right-2 top-2">
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                    </DialogClose>
                    {activeSrc && (
                        <img
                            src={activeSrc}
                            alt={title}
                            className="max-h-[90svh] max-w-full object-contain rounded shadow-md"
                        />
                    )}
                </DialogContent>
            </Dialog>
            {imageIds.length > 1 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {imageIds.map((imageId) => {
                        const src = previewUrls[imageId] || getCachedImageUrl(imageId, { variant: "thumbnail" });
                        const isActive = imageId === activeImageId;
                        return (
                            <button
                                key={imageId}
                                type="button"
                                onClick={() => setActiveImageId(imageId)}
                                className={`overflow-hidden rounded-lg border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-primary" : "border-border"}`}
                                aria-pressed={isActive}
                            >
                                {src ? (
                                    <img src={src} alt={title} className="aspect-square h-full w-full object-cover" />
                                ) : (
                                    <div className="aspect-square flex items-center justify-center text-xs text-muted-foreground">Loading...</div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};