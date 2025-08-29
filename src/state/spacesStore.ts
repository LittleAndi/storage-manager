import { create } from "zustand";
import { supabase } from "@/supabaseClient";
import type { NewSpace, Space } from "@/types/entities";
import { newSpaceToDbSpace } from "@/lib/mappers";
import { dbSpaceToAppSpace } from "@/lib/mappers";
import type { Database } from "@/types/database.types";

interface SpacesState {
  spaces: Space[];
  loading: boolean;
  error: string | null;
  membershipRoles: Record<string, string>;
  membershipCounts: Record<string, number>;
  fetchSpaces: () => Promise<void>;
  addSpace: (space: NewSpace) => Promise<string | null>;
  updateSpace: (space: Space) => void;
  removeSpace: (id: string) => void;
  // NEW: member fetching state
  membersBySpace: Record<string, SpaceMember[]>;
  memberLoading: Record<string, boolean>;
  memberErrors: Record<string, string | null>;
  fetchSpaceMembers: (spaceId: string) => Promise<void>;
}
// NEW: exported member type
export interface SpaceMember {
  user_id: string;
  role: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export const useSpacesStore = create<SpacesState>((set, get) => ({
  spaces: [],
  loading: false,
  error: null,
  membershipRoles: {},
  membershipCounts: {},
  membersBySpace: {},
  memberLoading: {},
  memberErrors: {},
  fetchSpaces: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.from("spaces").select();
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      const spaces: Space[] = (data || []).map(dbSpaceToAppSpace);

      const membershipRoles: Record<string, string> = {};
      const membershipCounts: Record<string, number> = {};
      try {
        const { data: memberRows, error: memberError } = await supabase
          .from("space_members")
          .select("space_id, role");
        if (!memberError && memberRows) {
          for (const r of memberRows) {
            if (r.space_id) {
              // Count (non-owner) members
              membershipCounts[r.space_id] =
                (membershipCounts[r.space_id] || 0) + 1;
              if (r.role) {
                // Role of current user (will be overwritten only if the row belongs to current user;
                // if you need to scope to current user, include user_id in select and compare)
                membershipRoles[r.space_id] = r.role;
              }
            }
          }
        }
      } catch {
        // ignore
      }

      set({ spaces, membershipRoles, membershipCounts, loading: false });
      localStorage.setItem("spaces", JSON.stringify(spaces));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ error: message, loading: false });
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
  removeSpace: async (id) => {
    // Remove from Supabase database
    const { error } = await supabase.from("spaces").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      console.error(error.message);
      return;
    }
    // Remove from local state and localStorage
    const updated = get().spaces.filter((s) => s.id !== id);
    set({ spaces: updated });
    localStorage.setItem("spaces", JSON.stringify(updated));
  },
  fetchSpaceMembers: async (spaceId: string) => {
    const { memberLoading } = get();
    if (memberLoading[spaceId]) return; // avoid duplicate in-flight
    set((state) => ({
      memberLoading: { ...state.memberLoading, [spaceId]: true },
      memberErrors: { ...state.memberErrors, [spaceId]: null },
    }));
    const { data, error } = await supabase
      .rpc("get_space_members", { p_space: spaceId });
    if (error) {
      set((state) => ({
        memberLoading: { ...state.memberLoading, [spaceId]: false },
        memberErrors: { ...state.memberErrors, [spaceId]: error.message },
      }));
      return;
    }

    type DbSpaceMember =
      Database["public"]["Functions"]["get_space_members"]["Returns"][number];

    const rows: SpaceMember[] = (data || []).map((r: DbSpaceMember) => ({
      user_id: r.user_id,
      role: r.role,
      display_name: r.display_name ?? null,
      avatar_url: r.avatar_url ?? null,
    })) || [];
    set((state) => ({
      membersBySpace: { ...state.membersBySpace, [spaceId]: rows },
      memberLoading: { ...state.memberLoading, [spaceId]: false },
    }));
  },
}));
