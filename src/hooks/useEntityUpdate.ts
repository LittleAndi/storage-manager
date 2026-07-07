import { useState } from "react";
import { useSpacesStore } from "@/state/spacesStore";
import { useBoxesStore } from "@/state/boxesStore";
import { supabase } from "@/supabaseClient";
import type { Box, Space } from "@/types/entities";
import type { Database } from "@/types/database.types";
import { deleteImages } from "@/lib/imageUpload";
import { normalizeImageIds } from "@/lib/imageRefs";

type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];

type Kind = "space" | "box";

interface UseEntityUpdateArgs<TPatch extends Record<string, unknown>> {
    kind: Kind;
    entity: Space | Box;
    onSuccess?: (updated: Space | Box) => void;
    onError?: (err: unknown) => void;
    mapPatchToDb?: (patch: TPatch) => Record<string, unknown>; // optional customization
}

export function useEntityUpdate<TPatch extends Record<string, unknown>>(
    { kind, entity, onSuccess, onError, mapPatchToDb }: UseEntityUpdateArgs<
        TPatch
    >,
) {
    const updateSpace = useSpacesStore((s) => s.updateSpace);
    const updateBox = useBoxesStore((s) => s.updateBox);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    async function mutate(patch: TPatch) {
        setLoading(true);
        setError(null);
        try {
            const dbPatch = mapPatchToDb ? mapPatchToDb(patch) : patch;
            if (kind === "space") {
                const { error: err } = await supabase.from("spaces").update(
                    dbPatch as TablesUpdate<"spaces">,
                ).eq("id", entity.id);
                if (err) throw err;
                const entityImageIds = normalizeImageIds(entity.image_ids, entity.image_id);
                const patchHasImages = Object.prototype.hasOwnProperty.call(patch, "image_ids") || Object.prototype.hasOwnProperty.call(patch, "image_id");
                const nextImageIds = patchHasImages
                    ? normalizeImageIds(
                        (patch as { image_ids?: string[] }).image_ids,
                        (patch as { image_id?: string | null }).image_id ?? null,
                    )
                    : entityImageIds;
                const updatedBase: Space = {
                    ...(entity as Space),
                    ...patch,
                } as Space;
                const updated: Space = patchHasImages
                    ? { ...updatedBase, image_id: nextImageIds[0], image_ids: nextImageIds }
                    : updatedBase;
                updateSpace(updated);
                onSuccess?.(updated);
                const removedImageIds = entityImageIds.filter((id) => !nextImageIds.includes(id));
                if (removedImageIds.length) {
                    void deleteImages(removedImageIds);
                }
            } else {
                const { error: err } = await supabase.from("boxes").update(
                    dbPatch as TablesUpdate<"boxes">,
                ).eq("id", entity.id);
                if (err) throw err;
                const entityImageIds = normalizeImageIds(entity.image_ids, entity.image_id);
                const patchHasImages = Object.prototype.hasOwnProperty.call(patch, "image_ids") || Object.prototype.hasOwnProperty.call(patch, "image_id");
                const nextImageIds = patchHasImages
                    ? normalizeImageIds(
                        (patch as { image_ids?: string[] }).image_ids,
                        (patch as { image_id?: string | null }).image_id ?? null,
                    )
                    : entityImageIds;
                const updatedBase: Box = {
                    ...(entity as Box),
                    ...patch,
                } as Box;
                const updated: Box = patchHasImages
                    ? { ...updatedBase, image_id: nextImageIds[0], image_ids: nextImageIds }
                    : updatedBase;
                updateBox(updated);
                onSuccess?.(updated);
                const removedImageIds = entityImageIds.filter((id) => !nextImageIds.includes(id));
                if (removedImageIds.length) {
                    void deleteImages(removedImageIds);
                }
            }
        } catch (e) {
            setError(e);
            onError?.(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { mutate, loading, error };
}
