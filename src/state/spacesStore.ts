import { create } from "zustand";
import { supabase } from "@/supabaseClient";
import type { NewSpace, Space } from "@/types/entities";
import { newSpaceToDbSpace } from "@/lib/mappers";
import { dbSpaceToAppSpace } from "@/lib/mappers";
import type { Database } from "@/types/database.types";
import { confirmImages, deleteImages } from "@/lib/imageUpload";
import { normalizeImageIds } from "@/lib/imageRefs";

interface SpacesState {
  spaces: Space[];
  loading: boolean;
  error: string | null;
  /** map of spaceId -> resolved signed image URL */
  imageUrls: Record<string, string>;
  membershipRoles: Record<string, string>;
  membershipCounts: Record<string, number>;
  fetchSpaces: () => Promise<void>;
  setSpaceImageUrl: (spaceId: string, url: string) => void;
  addSpace: (space: NewSpace) => Promise<string | null>;
  updateSpace: (space: Space) => void;
  removeSpace: (id: string) => void;
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
  imageUrls: {},
  membershipRoles: {},
  membershipCounts: {},
  membersBySpace: {},
  memberLoading: {},
  memberErrors: {},
  fetchSpaces: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch spaces with box counts using Supabase aggregate
      const { data, error } = await supabase
        .from("spaces")
        .select(`*, boxes(count)`);
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      // Map spaces and attach boxCount
      const spaces: Space[] = (data || []).map(
        (
          space: Database["public"]["Tables"]["spaces"]["Row"] & {
            boxes?: { count: number }[];
          },
        ) => ({
          ...dbSpaceToAppSpace(space),
          boxCount: space.boxes?.[0]?.count ?? 0,
        }),
      );

      // Membership roles/counts logic unchanged
      const membershipRoles: Record<string, string> = {};
      const membershipCounts: Record<string, number> = {};
      try {
        const { data: memberRows, error: memberError } = await supabase
          .from("space_members")
          .select("space_id, role");
        if (!memberError && memberRows) {
          for (const r of memberRows) {
            if (r.space_id) {
              membershipCounts[r.space_id] =
                (membershipCounts[r.space_id] || 0) + 1;
              if (r.role) {
                membershipRoles[r.space_id] = r.role;
              }
            }
          }
        }
      } catch {
        // ignore
      }

      // Rehydrate any persisted imageUrls
      const savedImageUrlsRaw = localStorage.getItem("spaceImageUrls");
      const savedImageUrls: Record<string, string> = savedImageUrlsRaw
        ? JSON.parse(savedImageUrlsRaw)
        : {};

      set({
        spaces,
        membershipRoles,
        membershipCounts,
        loading: false,
        imageUrls: savedImageUrls,
      });
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
    const { data, error } = await supabase
      .from("spaces")
      .insert(dbInsert)
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
    void confirmImages(normalizeImageIds(space.image_ids, space.image_id), {
      metadataKey: "space_id",
      metadataValue: data[0].id,
    });
    return data[0].id;
  },
  setSpaceImageUrl: (spaceId: string, url: string) => {
    // update in-memory map and persist
    set((state) => {
      const imageUrls = { ...(state.imageUrls || {}), [spaceId]: url };
      const spaces = state.spaces.map((s) => s.id === spaceId ? { ...s } : s);
      try {
        localStorage.setItem("spaceImageUrls", JSON.stringify(imageUrls));
        localStorage.setItem("spaces", JSON.stringify(spaces));
      } catch {
        // ignore storage errors
      }
      return { imageUrls, spaces } as Partial<SpacesState>;
    });
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
    const target = get().spaces.find((s) => s.id === id);
    const imageIds = normalizeImageIds(target?.image_ids, target?.image_id);
    // 1. Remove space members first to avoid FK or policy issues when deleting shared spaces
    const { error: memberError } = await supabase
      .from("space_members")
      .delete()
      .eq("space_id", id);
    if (memberError) {
      set({ error: memberError.message });
      console.error("Failed to delete space members:", memberError.message);
      return; // abort deletion if we cannot remove members
    }

    // 2. Delete the space itself
    const { error: spaceError } = await supabase.from("spaces").delete().eq(
      "id",
      id,
    );
    if (spaceError) {
      set({ error: spaceError.message });
      console.error(spaceError.message);
      return;
    }

    // 3. Update local state and cached maps
    const updated = get().spaces.filter((s) => s.id !== id);
    set((state) => {
      const { membershipCounts, membershipRoles, membersBySpace, imageUrls } =
        state;
      const newMembershipCounts = { ...membershipCounts };
      const newMembershipRoles = { ...membershipRoles };
      const newMembersBySpace = { ...membersBySpace };
      const newImageUrls = { ...imageUrls };
      delete newMembershipCounts[id];
      delete newMembershipRoles[id];
      delete newMembersBySpace[id];
      delete newImageUrls[id];
      try {
        localStorage.setItem("spaces", JSON.stringify(updated));
        localStorage.setItem("spaceImageUrls", JSON.stringify(newImageUrls));
      } catch {
        // ignore storage failures
      }
      return {
        spaces: updated,
        membershipCounts: newMembershipCounts,
        membershipRoles: newMembershipRoles,
        membersBySpace: newMembersBySpace,
        imageUrls: newImageUrls,
      } as Partial<SpacesState>;
    });
    if (imageIds.length) {
      void deleteImages(imageIds);
    }
    // NOTE: If boxes are not cascading in DB, you may need a backend function to cascade delete boxes & their images.
  },
  fetchSpaceMembers: async (spaceId: string) => {
    const { memberLoading } = get();
    if (memberLoading[spaceId]) return; // avoid duplicate in-flight
    set((state) => ({
      memberLoading: { ...state.memberLoading, [spaceId]: true },
      memberErrors: { ...state.memberErrors, [spaceId]: null },
    }));
    const { data, error } = await supabase.rpc("get_space_members", {
      p_space: spaceId,
    });
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
