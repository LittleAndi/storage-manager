import { getImageUrls } from "@/lib/imageUpload";

/**
 * Shared signed URL resolution + caching layer for images (spaces & boxes).
 * - Caches per-session in-memory.
 * - Coalesces concurrent requests for the same id(s).
 * - Provides batch prefetch to minimize network round trips.
 */

// Caches per imageId which now may include both thumbnail and original
interface CachedEntry {
    thumbnail?: string;
    original?: string;
}
const urlCache: Record<string, CachedEntry> = {};
const inflight: Record<string, Promise<string | null> | undefined> = {};

/**
 * Resolve a single image id to a signed URL (cached).
 */
export async function resolveImageUrl(
    imageId: string | undefined | null,
    opts: { variant?: "thumbnail" | "original" } = {},
): Promise<string | null> {
    if (!imageId) return null;
    const variant = opts.variant || "thumbnail";
    const cached = urlCache[imageId];
    if (cached && (cached[variant] || cached.thumbnail || cached.original)) {
        return (cached[variant] || cached.thumbnail || cached.original) || null;
    }
    const existing = inflight[imageId];
    if (existing) return existing;

    const p = (async () => {
        try {
            const result = await getImageUrls([imageId]);
            const set = result[imageId];
            if (set) {
                urlCache[imageId] = {
                    thumbnail: set.thumbnail,
                    original: set.original,
                };
                return set[variant] || set.thumbnail || set.original || null;
            }
            return null;
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
    options: { variant?: "thumbnail" | "original" } = {},
): Promise<Record<string, string>> {
    const toFetch = imageIds.filter((id) =>
        !!id && !urlCache[id] && !inflight[id]
    );
    if (!toFetch.length) {
        // Return any already cached subset
        return Object.fromEntries(
            imageIds.filter((id) => !!id && urlCache[id]).map(
                (
                    id,
                ) => [id, (urlCache[id]!.thumbnail || urlCache[id]!.original)!],
            ),
        );
    }
    // Single batched call
    const promise = getImageUrls(toFetch).then((map) => {
        const out: Record<string, string> = {};
        for (const [id, set] of Object.entries(map)) {
            if (set) {
                urlCache[id] = {
                    thumbnail: set.thumbnail,
                    original: set.original,
                };
                const chosen = options.variant === "original"
                    ? (set.original || set.thumbnail)
                    : (set.thumbnail || set.original);
                if (chosen) out[id] = chosen;
            }
        }
        return out;
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
    opts: { variant?: "thumbnail" | "original" } = {},
): string | undefined {
    if (!imageId) return undefined;
    const entry = urlCache[imageId];
    if (!entry) return undefined;
    const variant = opts.variant || "thumbnail";
    return entry[variant] || entry.thumbnail || entry.original;
}

/**
 * Clear the entire in-memory cache (e.g., on logout) .
 */
export function resetImageUrlCache() {
    for (const k of Object.keys(urlCache)) delete urlCache[k];
}
