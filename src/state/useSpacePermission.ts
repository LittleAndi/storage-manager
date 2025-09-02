import { useAuthStore } from "@/state/authStore";
import { type SpaceMember, useSpacesStore } from "@/state/spacesStore";
import { useMemo } from "react";

export interface SpacePermission {
  isOwner: boolean;
  canEdit: boolean;
  canView: boolean;
  role: string | null;
}

// Role hierarchy: owner > admin > editor > viewer
const EDIT_ROLES = new Set(["owner", "admin", "editor"]);
const VIEW_ROLES = new Set(["owner", "admin", "editor", "viewer"]);

export function useSpacePermission(
  spaceId: string | undefined,
): SpacePermission {
  const user = useAuthStore((s) => s.user);
  const spaces = useSpacesStore((s) => s.spaces);
  const membersBySpace = useSpacesStore((s) => s.membersBySpace);

  return useMemo(() => {
    if (!spaceId || !user) {
      return { isOwner: false, canEdit: false, canView: false, role: null };
    }
    const space = spaces.find((s) => s.id === spaceId);
    const members: SpaceMember[] | undefined = membersBySpace[spaceId];

    let role: string | null = null;
    let isOwner = false;

    if (space && space.owner_id === user.id) {
      isOwner = true;
      role = "owner";
    } else if (members) {
      const member = members.find((m) => m.user_id === user.id);
      role = member?.role ?? null;
    }

    const canEdit = isOwner || (role ? EDIT_ROLES.has(role) : false);
    const canView = isOwner || (role ? VIEW_ROLES.has(role) : false);

    return { isOwner, canEdit, canView, role };
  }, [spaceId, user, spaces, membersBySpace]);
}
