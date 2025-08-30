import React from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/trash-icon";

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
  /** Current user's membership role when shared */
  role?: string;
  /** Delete handler (only for owned spaces) */
  onDelete?: () => void;
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
  role,
  onDelete,
}) => {
  const thumb = thumbnailUrl; // unified camelCase
  return (
    <div
      className={`relative group bg-white rounded shadow p-4 flex items-center cursor-pointer transition-colors ${
        isShared ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-background hover:bg-accent/50"
      }`}
      onClick={onOpen}
      aria-label={`Open space ${name}`}
    >
      {!isShared && onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-7 w-7 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete space ${name}`}
        >
          <TrashIcon size={16} aria-hidden="true" />
        </Button>
      )}
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
        {isShared && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">Shared</Badge>
            {role && (
              <Badge variant="secondary" title={`Your role: ${role}`} className="uppercase tracking-wide text-[10px]">
                {role}
              </Badge>
            )}
          </div>
        )}
        {location && <p className="text-sm text-muted-foreground mt-1">{location}</p>}
        <p className="text-xs text-gray-400 mt-1">Members: {memberCount ?? 0} {owner && (`| Owner: ${owner}`)}</p>
      </div>
    </div>
  );
};

export default SpaceCard;
