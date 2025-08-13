import { create } from "zustand";
import type { Space } from "@/types/entities";

interface SpacesState {
  spaces: Space[];
  loading: boolean;
  error: string | null;
  fetchSpaces: () => Promise<void>;
  addSpace: (space: Space) => void;
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
  addSpace: (space) => {
    const raw = localStorage.getItem("spaces");
    const existingSpaces: Space[] = raw ? JSON.parse(raw) : [];
    const now = new Date(Date.now()).toISOString();
    const newSpace: Space = {
      ...space,
      created_at: now,
      modified_at: now,
    };
    const updated = [...existingSpaces, newSpace];
    set({ spaces: updated });
    localStorage.setItem("spaces", JSON.stringify(updated));
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
