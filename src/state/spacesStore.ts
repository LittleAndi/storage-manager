import { create } from "zustand";

export interface Space {
  id: string;
  name: string;
  location?: string;
  memberCount?: number;
  owner?: string;
  thumbnailUrl?: string;
}

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
    const updated = [...existingSpaces, space];
    set({ spaces: updated });
    localStorage.setItem("spaces", JSON.stringify(updated));
  },
  updateSpace: (space) =>
    set({ spaces: get().spaces.map((s) => (s.id === space.id ? space : s)) }),
  removeSpace: (id) => set({ spaces: get().spaces.filter((s) => s.id !== id) }),
}));
