import { useState } from "react";
import { useSpacesStore } from "@/state/spacesStore";
import { useBoxesStore } from "@/state/boxesStore";
import { supabase } from "@/supabaseClient";
import type { Box, Space } from "@/types/entities";

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
                    dbPatch,
                ).eq("id", entity.id);
                if (err) throw err;
                const updated: Space = { ...(entity as Space), ...patch };
                updateSpace(updated);
                onSuccess?.(updated);
            } else {
                const { error: err } = await supabase.from("boxes").update(
                    dbPatch,
                ).eq("id", entity.id);
                if (err) throw err;
                const updated: Box = { ...(entity as Box), ...patch };
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
