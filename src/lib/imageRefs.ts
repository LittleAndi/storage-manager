export function normalizeImageIds(
    imageIds?: Array<string | null | undefined> | null,
    legacyImageId?: string | null,
): string[] {
    const normalized = (imageIds ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0,
    );
    if (legacyImageId && !normalized.includes(legacyImageId)) {
        return [legacyImageId, ...normalized];
    }
    return normalized;
}

export function getPrimaryImageId(entity?: {
    image_id?: string | null;
    image_ids?: Array<string | null | undefined> | null;
}): string | undefined {
    if (!entity) return undefined;
    const normalized = normalizeImageIds(entity.image_ids, entity.image_id);
    return normalized[0];
}