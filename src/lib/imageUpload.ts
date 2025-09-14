/**
 * Shared image upload & confirm helper for spaces and boxes.
 *
 * Endpoints expected (Azure Functions / API):
 *  POST /api/images/{imageId}  (multipart/form-data: file)
 *      -> { image_id: string, preview_url?: string }
 *  PUT /api/images/{imageId} (json: { metadata_key, metadata_value })
 *      -> { message: string }
 *  POST /api/images/urls (json: string[])
 *      -> { [image_id: string]: { key: string, value: string } }
 */

export interface UploadResult {
    imageId: string;
    previewUrl?: string; // temporary signed URL for immediate preview
}

export interface ConfirmOptions {
    /** optional key (e.g., space_id or box_id) */
    metadataKey?: string;
    /** optional value (space / box id) */
    metadataValue?: string;
}

export class ImageUploadError extends Error {}

async function http<T>(url: string, init: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text();
        throw new ImageUploadError(`${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json()) as T;
}

/**
 * Upload a file and receive an image id (and optional preview URL).
 * The backend expects the image id as a route parameter; we generate a UUID client-side.
 */
export async function uploadImage(
    file: File,
    providedId?: string,
): Promise<UploadResult> {
    const imageId = providedId ||
        (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const form = new FormData();
    form.append("file", file);
    const data = await http<{ image_id: string; preview_url?: string }>(
        `/api/images/${imageId}`,
        {
            method: "POST",
            body: form,
        },
    );
    return { imageId: data.image_id, previewUrl: data.preview_url };
}

/** Optionally confirm after creating the domain entity (space or box). */
export async function confirmImage(
    imageId: string,
    options?: ConfirmOptions,
): Promise<boolean> {
    if (!options?.metadataKey || !options.metadataValue) return false;
    // Backend expects only metadata key/value; imageId is in the route
    const res = await fetch(`/api/images/${imageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            metadata_key: options.metadataKey,
            metadata_value: options.metadataValue,
        }),
    });
    if (!res.ok) return false;
    // Optionally read body (not strictly needed)
    return true;
}

// New response element per blob
export interface ImageBlobInfo {
    name: string; // blob name without extension
    url: string; // signed URL
    type: string; // 'thumbnail' | 'original' (string to allow forward compat)
}

export interface ImageUrlSet {
    thumbnail?: string; // preferred small preview
    original?: string; // full resolution (still webp but higher quality)
    // Keep raw list for any future UI needs (e.g., additional transforms)
    blobs: ImageBlobInfo[];
}

/** Resolve a set of image ids to signed URLs (thumbnail + original). */
export async function getImageUrls(
    imageIds: string[],
): Promise<Record<string, ImageUrlSet>> {
    if (!imageIds.length) return {};
    const data = await http<Record<string, ImageBlobInfo[] | null>>(
        "/api/images/urls",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(imageIds),
        },
    );
    const map: Record<string, ImageUrlSet> = {};
    for (const [imageId, arr] of Object.entries(data || {})) {
        if (!Array.isArray(arr)) continue;
        const blobs = arr.filter(
            (b): b is ImageBlobInfo => !!b && typeof b.url === "string",
        );
        let thumbnail: string | undefined;
        let original: string | undefined;
        for (const b of blobs) {
            if (b.type === "thumbnail" && !thumbnail) thumbnail = b.url;
            if (b.type === "original" && !original) original = b.url;
        }
        // Fallbacks: if only one exists use it for both roles
        if (!thumbnail && original) thumbnail = original;
        if (!original && thumbnail) original = thumbnail;
        map[imageId] = { thumbnail, original, blobs };
    }
    return map;
}

/** Convenience: upload (immediate preview) then later confirm after entity creation. */
export async function uploadAndMaybeConfirm(
    file: File,
    confirm?: {
        afterEntityId?: string;
        entityId?: string;
        metadataKey?: string;
    },
): Promise<UploadResult> {
    const result = await uploadImage(file);
    // If entity id already known we can confirm immediately
    if (confirm?.entityId && confirm.metadataKey) {
        try {
            await confirmImage(result.imageId, {
                metadataKey: confirm.metadataKey,
                metadataValue: confirm.entityId,
            });
        } catch {
            // swallow so UI can still show preview; subsequent retry path can exist
            /* noop */
        }
    }
    return result;
}
