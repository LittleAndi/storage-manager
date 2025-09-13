import { getImageUrls } from "@/lib/imageUpload";

/**
 * Shared signed URL resolution + caching layer for images (spaces & boxes).
 * - Caches per-session in-memory.
 * - Coalesces concurrent requests for the same id(s).
 * - Provides batch prefetch to minimize network round trips.
 */

const urlCache: Record<string, string> = {};
const inflight: Record<string, Promise<string | null> | undefined> = {};

/**
 * Resolve a single image id to a signed URL (cached).
 */
export async function resolveImageUrl(
    imageId: string | undefined | null,
): Promise<string | null> {
    if (!imageId) return null;
    if (urlCache[imageId]) return urlCache[imageId];
    const existing = inflight[imageId];
    if (existing) return existing;

    const p = (async () => {
        try {
            const result = await getImageUrls([imageId]);
            const url = result[imageId] || null;
            if (url) urlCache[imageId] = url;
            return url;
        } finally {
            delete inflight[imageId];
        }
    })();
    inflight[imageId] = p;
    return p;
}

/**
 * Prefetch multiple image ids (skips cached & in-flight) and returns a map of any newly fetched URLs.
 */
export async function prefetchImageUrls(
    imageIds: string[],
): Promise<Record<string, string>> {
    const toFetch = imageIds.filter((id) =>
        !!id && !urlCache[id] && !inflight[id]
    );
    if (!toFetch.length) {
        // Return any already cached subset
        return Object.fromEntries(
            imageIds.filter((id) => !!id && urlCache[id]).map(
                (id) => [id, urlCache[id]!]
            ),
        );
    }
    // Single batched call
    const promise = getImageUrls(toFetch).then((map) => {
        for (const [id, url] of Object.entries(map)) {
            if (url) urlCache[id] = url;
        }
        return map;
    }).finally(() => {
        for (const id of toFetch) delete inflight[id];
    });
    // Mark all as inflight referencing same promise but extracting their individual URL
    for (const id of toFetch) {
        inflight[id] = promise.then((m) => m[id] || null);
    }
    return promise;
}

/**
 * Get cached URL if present (sync access) else undefined.
 */
export function getCachedImageUrl(
    imageId: string | undefined | null,
): string | undefined {
    return imageId ? urlCache[imageId] : undefined;
}

/**
 * Clear the entire in-memory cache (e.g., on logout) .
 */
export function resetImageUrlCache() {
    for (const k of Object.keys(urlCache)) delete urlCache[k];
}
