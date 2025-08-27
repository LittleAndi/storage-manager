import React from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SpaceCardProps {
  id: string;
  name: string;
  location?: string;
  memberCount?: number;
  owner?: string | null;
  /** camelCase variant (internal UI prop) */
  thumbnailUrl?: string;
  onOpen?: () => void;
  /** Indicates space is not owned by current user */
  isShared?: boolean;
  /** Owner display name (tooltip) */
  ownerName?: string;
}

const SpaceCard: React.FC<SpaceCardProps> = ({
  name,
  location,
  memberCount,
  owner,
  thumbnailUrl,
  onOpen,
  isShared,
  ownerName,
}) => {
  const thumb = thumbnailUrl; // unified camelCase
  return (
    <div
      className={`bg-white rounded shadow p-4 flex items-center cursor-pointer transition-colors ${
        isShared ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-background hover:bg-accent/50"
      }`}
      onClick={onOpen}
      aria-label={`Open space ${name}`}
    >
      {thumb && (
        <img
          src={thumb}
          alt={name}
          className="w-16 h-16 rounded object-cover mr-4 border"
          loading="lazy"
        />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {isShared && (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white"
              title={`Owned by ${ownerName || owner || "another user"}`}
            >
              <Users size={14} />
            </span>
          )}
          <span className="font-medium line-clamp-1" title={name}>{name}</span>
        </div>
        {isShared && <Badge variant="outline" className="mt-1">Shared</Badge>}
        {location && <p className="text-sm text-muted-foreground mt-1">{location}</p>}
        <p className="text-xs text-gray-400 mt-1">Members: {memberCount ?? 0} {owner && (`| Owner: ${owner}`)}</p>
      </div>
    </div>
  );
};

export default SpaceCard;
