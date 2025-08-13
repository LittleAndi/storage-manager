import { create } from "zustand";
import { supabase } from "@/supabaseClient";
import type { NewSpace, Space } from "@/types/entities";
import { newSpaceToDbSpace } from "@/lib/mappers";

interface SpacesState {
  spaces: Space[];
  loading: boolean;
  error: string | null;
  fetchSpaces: () => Promise<void>;
  addSpace: (
    space: NewSpace,
  ) => Promise<string | null>;
  updateSpace: (space: Space) => void;
  removeSpace: (id: string) => void;
}

export const useSpacesStore = create<SpacesState>((set, get) => ({
  spaces: [],
  loading: false,
  error: null,
  fetchSpaces: async () => {
    set({ loading: true, error: null });
    try {
      const raw = localStorage.getItem("spaces");
      const spaces: Space[] = raw ? JSON.parse(raw) : [];
      set({ spaces: spaces, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
  addSpace: async (space) => {
    const raw = localStorage.getItem("spaces");
    const existingSpaces: Space[] = raw ? JSON.parse(raw) : [];
    const now = new Date(Date.now()).toISOString();
    // Use mapper for NewSpace to DB Insert type
    const dbInsert = newSpaceToDbSpace(space, now);
    const { data, error } = await supabase.from("spaces").insert(dbInsert)
      .select();
    if (error || !data || !data[0]?.id) {
      set({ error: error?.message || "Failed to create space" });
      console.error(error?.message);
      return null;
    }
    const newSpace: Space = {
      ...space,
      id: data[0].id,
      created_at: now,
      modified_at: now,
    };
    const updated = [...existingSpaces, newSpace];
    set({ spaces: updated });
    localStorage.setItem("spaces", JSON.stringify(updated));
    return data[0].id;
  },
  updateSpace: (space) =>
    set({
      spaces: get().spaces.map((s) =>
        s.id === space.id
          ? { ...space, modified_at: new Date(Date.now()).toISOString() }
          : s
      ),
    }),
  removeSpace: (id) => {
    const updated = get().spaces.filter((s) => s.id !== id);
    set({ spaces: updated });
    localStorage.setItem("spaces", JSON.stringify(updated));
  },
}));
