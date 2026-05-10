import { useState } from "react";
import { useSpacesStore } from "@/state/spacesStore";
import { useBoxesStore } from "@/state/boxesStore";
import { supabase } from "@/supabaseClient";
import type { Box, Space } from "@/types/entities";
import type { Database } from "@/types/database.types";

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
                const updatedBase: Space = {
                    ...(entity as Space),
                    ...patch,
                } as Space;
                // If image_id explicitly null, remove from local object
                const updated: Space =
                    (Object.prototype.hasOwnProperty.call(patch, "image_id") &&
                            (patch as { image_id?: unknown }).image_id === null)
                        ? { ...updatedBase, image_id: undefined }
                        : updatedBase;
                updateSpace(updated);
                onSuccess?.(updated);
            } else {
                const { error: err } = await supabase.from("boxes").update(
                    dbPatch as TablesUpdate<"boxes">,
                ).eq("id", entity.id);
                if (err) throw err;
                const updatedBase: Box = {
                    ...(entity as Box),
                    ...patch,
                } as Box;
                const updated: Box =
                    (Object.prototype.hasOwnProperty.call(patch, "image_id") &&
                            (patch as { image_id?: unknown }).image_id === null)
                        ? { ...updatedBase, image_id: undefined }
                        : updatedBase;
                updateBox(updated);
                onSuccess?.(updated);
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
