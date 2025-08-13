// src/lib/mappers.ts
import type { Space, UserProfile } from "@/types/entities";
import type { Database } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";

export function dbSpaceToAppSpace(db: Database["public"]["Tables"]["spaces"]["Row"]): Space {
  return {
    id: db.id,
    name: db.name,
    location: db.location ?? undefined,
    owner_id: db.owner_id,
    thumbnail_url: db.thumbnail_url ?? undefined,
    created_at: db.created_at,
    modified_at: db.modified_at,
    memberCount: 0,
  };
}

export function appSpaceToDbSpace(space: Space): Database["public"]["Tables"]["spaces"]["Insert"] {
  return {
    id: space.id,
    name: space.name,
    location: space.location ?? null,
    owner_id: space.owner_id,
    thumbnail_url: space.thumbnail_url ?? null,
    created_at: space.created_at,
    modified_at: space.modified_at,
  };
}

export function supabaseUserToUserProfile(supabaseUser: User): UserProfile {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email || "",
    avatar_url: supabaseUser.user_metadata?.avatar_url || "",
    roles: [], // Populate if you have roles in metadata or elsewhere
  };
}