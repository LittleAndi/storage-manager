import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    uploadImage,
    type UploadResult,
} from "@/lib/imageUpload";
import {
    getCachedImageUrl,
    prefetchImageUrls,
} from "@/lib/imageUrls";

export interface MultiImageUploadFieldProps {
    name: string;
    label?: string;
    description?: string;
    onUploadingChange?: (uploading: boolean) => void;
    onImagesUploaded?: (results: UploadResult[]) => Promise<void> | void;
    onClear?: () => void;
}

export const MultiImageUploadField: React.FC<MultiImageUploadFieldProps> = ({
    name,
    label = "Images",
    description,
    onUploadingChange,
    onImagesUploaded,
    onClear,
}) => {
    const { setValue, watch } = useFormContext();
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const imageIds = ((watch(name) as string[] | undefined) ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0,
    );
    const imageIdsKey = imageIds.join("|");
    const imageIdsRef = React.useRef(imageIds);
    imageIdsRef.current = imageIds;
    const [uploading, setUploading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [previewUrls, setPreviewUrls] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        let cancelled = false;
        async function syncPreviews() {
            const currentImageIds = imageIdsRef.current;
            if (!currentImageIds.length) {
                setPreviewUrls({});
                return;
            }
            const next: Record<string, string> = {};
            for (const imageId of currentImageIds) {
                const cached = getCachedImageUrl(imageId);
                if (cached) {
                    next[imageId] = cached;
                }
            }
            setPreviewUrls(next);
            const missing = currentImageIds.filter((imageId) => !next[imageId]);
            if (!missing.length) return;
            try {
                const fetched = await prefetchImageUrls(missing);
                if (cancelled) return;
                setPreviewUrls((current) => ({ ...current, ...fetched }));
            } catch (e) {
                console.warn("MultiImageUploadField: failed to prefetch previews", e);
            }
        }
        void syncPreviews();
        return () => {
            cancelled = true;
        };
    }, [imageIdsKey]);

    const setImages = React.useCallback(
        (nextIds: string[]) => {
            setValue(name as any, nextIds as any, { shouldDirty: true, shouldTouch: true }); // eslint-disable-line @typescript-eslint/no-explicit-any
        },
        [name, setValue],
    );

    const handlePickFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        onUploadingChange?.(true);
        setError(null);
        try {
            const uploads = await Promise.all(
                Array.from(files).map(async (file) => {
                    const result = await uploadImage(file);
                    return result;
                }),
            );
            setPreviewUrls((current) => {
                const next = { ...current };
                for (const result of uploads) {
                    if (result.previewUrl) {
                        next[result.imageId] = result.previewUrl;
                    }
                }
                return next;
            });
            const nextIds = Array.from(
                new Set([...imageIds, ...uploads.map((result) => result.imageId)]),
            );
            setImages(nextIds);
            await onImagesUploaded?.(uploads);
        } catch (err) {
            setError((err as Error).message || "Upload failed");
        } finally {
            setUploading(false);
            onUploadingChange?.(false);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    const handleRemove = async (imageId: string) => {
        const nextIds = imageIds.filter((id) => id !== imageId);
        setImages(nextIds);
        setPreviewUrls((current) => {
            const next = { ...current };
            delete next[imageId];
            return next;
        });
        if (!nextIds.length) {
            onClear?.();
        }
    };

    const handleClearAll = async () => {
        setImages([]);
        setPreviewUrls({});
        onClear?.();
    };

    const handleSetPrimary = (imageId: string) => {
        setImages([imageId, ...imageIds.filter((id) => id !== imageId)]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor={`${name}-input`}>
                        {label}
                    </label>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                {imageIds.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={uploading}
                    >
                        Clear all
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? "Uploading..." : "Add images"}
                </Button>
                <span className="text-xs text-muted-foreground">
                    Select one or more images.
                </span>
            </div>
            <Input
                ref={inputRef}
                id={`${name}-input`}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void handlePickFiles(e.target.files)}
            />
            {imageIds.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {imageIds.map((imageId, index) => {
                        const isPrimary = index === 0;
                        const src = previewUrls[imageId];
                        return (
                            <div
                                key={imageId}
                                className="rounded-xl border border-border bg-card p-2 space-y-2"
                            >
                                <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/3]">
                                    {src ? (
                                        <img
                                            src={src}
                                            alt={`Selected image ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                            Loading preview...
                                        </div>
                                    )}
                                    {isPrimary && (
                                        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                            Primary
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {!isPrimary && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSetPrimary(imageId)}
                                        >
                                            Make primary
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => void handleRemove(imageId)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                    No images yet.
                </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
};