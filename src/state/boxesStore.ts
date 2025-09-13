import { create } from "zustand";
import { supabase } from "@/supabaseClient";
import type { Box, NewBox } from "@/types/entities";
import { dbBoxToAppBox, newBoxToDbBox } from "@/lib/mappers";
import { confirmImage } from "@/lib/imageUpload";

interface BoxesState {
    boxes: Box[];
    loading: boolean;
    error: string | null;
    /** map of boxId -> resolved signed image URL */
    imageUrls: Record<string, string>;
    fetchBoxes: (spaceId: string) => Promise<void>;
    addBox: (box: NewBox) => Promise<string | null>;
    updateBox: (box: Box) => void;
    removeBox: (id: string) => void;
    setBoxImageUrl: (boxId: string, url: string) => void;
}

export const useBoxesStore = create<BoxesState>((set, get) => ({
    boxes: [],
    loading: false,
    error: null,
    imageUrls: {},
    fetchBoxes: async (spaceId) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.from("boxes").select().eq(
                "space_id",
                spaceId,
            );
            if (error) {
                set({ error: error.message, loading: false });
                return;
            }
            const boxes: Box[] = (data || []).map(dbBoxToAppBox);
            // Rehydrate any persisted image URLs (box specific)
            const savedRaw = localStorage.getItem("boxImageUrls");
            const saved: Record<string, string> = savedRaw
                ? JSON.parse(savedRaw)
                : {};
            set({ boxes, loading: false, imageUrls: saved });
            localStorage.setItem(
                `boxes_${spaceId}`,
                JSON.stringify(boxes),
            );
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            set({ error: message, loading: false });
        }
    },
    addBox: async (box) => {
        const raw = localStorage.getItem(`boxes_${box.space_id}`);
        const existingBoxes: Box[] = raw ? JSON.parse(raw) : [];
        const now = new Date(Date.now()).toISOString();
        const dbInsert = newBoxToDbBox(box, now);
        const { data, error } = await supabase
            .from("boxes")
            .insert(dbInsert)
            .select();
        if (error || !data || !data[0]?.id) {
            set({ error: error?.message || "Failed to create box" });
            console.error(error?.message);
            return null;
        }
        const newBox: Box = dbBoxToAppBox(data[0]);
        // Ensure image_id is retained from form submission if mapper/DB returns null
        if (
            !newBox.image_id &&
            (box as unknown as { image_id?: string }).image_id
        ) {
            newBox.image_id =
                (box as unknown as { image_id?: string }).image_id;
        }
        const updated = [...existingBoxes, newBox];
        set({ boxes: updated });
        localStorage.setItem(`boxes_${box.space_id}`, JSON.stringify(updated));
        // Fire-and-forget confirmImage if we have an image id
        if (newBox.image_id) {
            confirmImage(newBox.image_id, {
                metadataKey: "box_id",
                metadataValue: newBox.id,
            }).catch((e) => {
                console.warn("confirmImage failed for box", newBox.id, e);
            });
        }
        return data[0].id;
    },
    updateBox: (box) =>
        set({
            boxes: get().boxes.map((b) =>
                b.id === box.id
                    ? {
                        ...box,
                        modified_at: new Date(Date.now()).toISOString(),
                    }
                    : b
            ),
        }),
    removeBox: async (id) => {
        const { error } = await supabase.from("boxes").delete().eq("id", id);
        if (error) {
            set({ error: error.message });
            console.error(error.message);
            return;
        }
        const updated = get().boxes.filter((b) => b.id !== id);
        set({ boxes: updated });
        // Optionally update localStorage for the current space
    },
    setBoxImageUrl: (boxId, url) => {
        set((state) => {
            const imageUrls = { ...(state.imageUrls || {}), [boxId]: url };
            try {
                localStorage.setItem("boxImageUrls", JSON.stringify(imageUrls));
            } catch {
                // ignore
            }
            // Also update in-memory box object if present (for immediate UI update if it stores temp field)
            const boxes = state.boxes.map((b) =>
                b.id === boxId
                    ? { ...b /* maintain backward compat field if needed */ }
                    : b
            );
            return { imageUrls, boxes } as Partial<BoxesState>;
        });
    },
}));
