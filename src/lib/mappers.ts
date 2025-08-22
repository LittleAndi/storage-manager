// src/lib/mappers.ts
import type {
  Box,
  NewBox,
  NewSpace,
  Space,
  UserProfile,
} from "@/types/entities";
import type { Database } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";

export function dbSpaceToAppSpace(
  db: Database["public"]["Tables"]["spaces"]["Row"],
): Space {
  return {
    id: db.id,
    name: db.name,
    location: db.location ?? undefined,
    owner_id: db.owner_id,
    owner: db.owner ?? undefined,
    thumbnail_url: db.thumbnail_url ?? undefined,
    created_at: db.created_at,
    modified_at: db.modified_at,
    memberCount: 0,
  };
}

export function appSpaceToDbSpace(
  space: Space,
): Database["public"]["Tables"]["spaces"]["Insert"] {
  return {
    id: space.id,
    name: space.name,
    location: space.location ?? null,
    owner_id: space.owner_id,
    // owner is set by the database, do not send from app
    thumbnail_url: space.thumbnail_url ?? null,
    created_at: space.created_at,
    modified_at: space.modified_at,
  };
}

// Mapper for NewSpace to DB Insert type
export function newSpaceToDbSpace(
  space: NewSpace,
  now: string,
): Database["public"]["Tables"]["spaces"]["Insert"] {
  return {
    name: space.name,
    location: space.location ?? null,
    owner_id: space.owner_id,
    // owner is set by the database, do not send from app
    thumbnail_url: space.thumbnail_url ?? null,
    created_at: now,
    modified_at: now,
    // id and memberCount are not included for insert
  };
}

// Box mappers
export function dbBoxToAppBox(
  db: Database["public"]["Tables"]["boxes"]["Row"],
): Box {
  return {
    id: db.id,
    space_id: db.space_id,
    name: db.name,
    location: db.location ?? undefined,
    thumbnail_url: db.thumbnail_url ?? undefined,
    created_at: db.created_at,
    modified_at: db.modified_at,
    content: db.content,
  };
}

export function appBoxToDbBox(
  box: Box,
): Database["public"]["Tables"]["boxes"]["Insert"] {
  return {
    id: box.id,
    space_id: box.space_id,
    name: box.name,
    location: box.location ?? null,
    thumbnail_url: box.thumbnail_url ?? null,
    created_at: box.created_at,
    modified_at: box.modified_at,
    content: box.content,
  };
}

export function newBoxToDbBox(
  box: NewBox,
  now: string,
): Database["public"]["Tables"]["boxes"]["Insert"] {
  return {
    space_id: box.space_id,
    name: box.name,
    location: box.location ?? null,
    thumbnail_url: box.thumbnail_url ?? null,
    created_at: now,
    modified_at: now,
    content: box.content,
    // id is not included for insert
  };
}

export function supabaseUserToUserProfile(supabaseUser: User): UserProfile {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email ||
      "",
    avatar_url: supabaseUser.user_metadata?.avatar_url || "",
    roles: [], // Populate if you have roles in metadata or elsewhere
  };
}
