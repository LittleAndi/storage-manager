import { create } from "zustand";
import { supabase } from "@/supabaseClient";
import type { Box, NewBox } from "@/types/entities";
import { dbBoxToAppBox, newBoxToDbBox } from "@/lib/mappers";

interface BoxesState {
    boxes: Box[];
    loading: boolean;
    error: string | null;
    fetchBoxes: (spaceId: string) => Promise<void>;
    addBox: (box: NewBox) => Promise<string | null>;
    updateBox: (box: Box) => void;
    removeBox: (id: string) => void;
}

export const useBoxesStore = create<BoxesState>((set, get) => ({
    boxes: [],
    loading: false,
    error: null,
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
            set({ boxes, loading: false });
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
        const updated = [...existingBoxes, newBox];
        set({ boxes: updated });
        localStorage.setItem(`boxes_${box.space_id}`, JSON.stringify(updated));
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
}));
