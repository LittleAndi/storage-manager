/**
 * Shared image upload & confirm helper for spaces and boxes.
 *
 * Endpoints expected (Azure Functions / API):
 *  POST /api/UploadImage  (multipart/form-data: file)
 *      -> { image_id: string, preview_url?: string }
 *  POST /api/ConfirmImage (json: { image_id, metadata_key?, metadata_value? })
 *      -> { success: boolean }
 *  POST /api/GetImageUrls (json: { image_ids: string[] })
 *      -> { images: { image_id: string, url: string }[] }
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

/** Upload a file and receive an image id (and optional preview URL). */
export async function uploadImage(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append("file", file);
    // Rely on relative path so it works in local dev & prod
    const data = await http<{ image_id: string; preview_url?: string }>(
        "/api/UploadImage",
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
    const payload: Record<string, string> = { image_id: imageId } as Record<
        string,
        string
    >;
    if (options?.metadataKey && options.metadataValue) {
        payload.metadata_key = options.metadataKey;
        payload.metadata_value = options.metadataValue;
    }
    const data = await http<{ success?: boolean }>("/api/ConfirmImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return !!data.success;
}

/** Resolve a set of image ids to signed URLs. */
export async function getImageUrls(
    imageIds: string[],
): Promise<Record<string, string>> {
    if (!imageIds.length) return {};
    const data = await http<{ images: { image_id: string; url: string }[] }>(
        "/api/GetImageUrls",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_ids: imageIds }),
        },
    );
    const map: Record<string, string> = {};
    for (const img of data.images || []) {
        map[img.image_id] = img.url;
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
