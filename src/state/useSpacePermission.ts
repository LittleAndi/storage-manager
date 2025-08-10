import { useCallback } from "react";

export interface SpacePermission {
  isOwner: boolean;
  canEdit: boolean;
  canView: boolean;
}

export function useSpacePermission(spaceId: string): SpacePermission {
  // TODO: Fetch user roles for the space from global state or API
  // Placeholder logic
  return {
    isOwner: false,
    canEdit: true,
    canView: true,
  };
}
