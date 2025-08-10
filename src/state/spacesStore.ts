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
      // TODO: Replace with API call
      const spaces: Space[] = [];
      set({ spaces, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
  addSpace: (space) => set({ spaces: [...get().spaces, space] }),
  updateSpace: (space) =>
    set({ spaces: get().spaces.map((s) => (s.id === space.id ? space : s)) }),
  removeSpace: (id) => set({ spaces: get().spaces.filter((s) => s.id !== id) }),
}));
