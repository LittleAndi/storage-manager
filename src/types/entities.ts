// Centralized entity models for the app
// Type for creating a new space (no id, created_at, modified_at)
export type NewSpace = Omit<Space, "id" | "created_at" | "modified_at">;

export interface Space {
  id: string;
  name: string;
  location?: string;
  owner_id: string;
  owner?: string | null;
  // Deprecated: thumbnail_url kept temporarily for backward compatibility with
  // any cached client state referencing older spaces rows. Will be removed once
  // all code paths rely solely on image_id and signed URLs.
  thumbnail_url?: string;
  // Primary image reference (UUID key used to fetch signed URL via image API)
  image_id?: string;
  created_at?: string | null; // ISO timestamp
  modified_at?: string | null; // ISO timestamp
  boxCount?: number; // Number of boxes in this space
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  roles: string[];
}

// Type for creating a new box (no id, created_at, modified_at)
export type NewBox = Omit<Box, "id" | "created_at" | "modified_at">;

export interface Box {
  id: string;
  name: string;
  space_id: string;
  location?: string;
  // Primary image reference (UUID key used to fetch signed URL via image API)
  image_id?: string;
  created_at?: string | null; // ISO timestamp
  modified_at?: string | null; // ISO timestamp
  content?: string | null;
}

export interface Item {
  id: string;
  name: string;
  box_id: string;
  description?: string;
  quantity: number;
  created_at: string; // ISO timestamp
  modified_at: string; // ISO timestamp
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: string; // e.g., 'viewer', 'editor'
  created_at: string; // ISO timestamp
}
