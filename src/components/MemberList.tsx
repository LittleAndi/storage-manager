import React from "react";
import { Badge } from "@/components/ui/badge";
import { useSpacesStore, type SpaceMember } from "@/state/spacesStore";

interface MemberListProps {
  spaceId: string;
  ownerId?: string;
  ownerName?: string | null;
}

const roleLabel = (r: string | null) =>
  !r ? "member" : r.replace(/^space_/, "").replace(/_/g, " ");

export const MemberList: React.FC<MemberListProps> = ({ spaceId, ownerId, ownerName }) => {
  const fetchSpaceMembers = useSpacesStore(s => s.fetchSpaceMembers);
  const membersBySpace = useSpacesStore(s => s.membersBySpace);
  const memberLoading = useSpacesStore(s => s.memberLoading);
  const memberErrors = useSpacesStore(s => s.memberErrors);

  React.useEffect(() => {
    fetchSpaceMembers(spaceId);
  }, [spaceId, fetchSpaceMembers]);

  const loading = memberLoading[spaceId];
  const error = memberErrors[spaceId] || null;
  const rawMembers: SpaceMember[] = membersBySpace[spaceId] || [];

  // Build list including owner first
  type MemberListItem = SpaceMember & { isOwner?: boolean };
  const members: MemberListItem[] = [];
  if (ownerId) {
    members.push({
      user_id: ownerId,
      role: "owner",
      display_name: ownerName || "Owner",
      avatar_url: null,
      isOwner: true,
    });
  }
  for (const m of rawMembers) {
    if (m.user_id === ownerId) continue;
    members.push(m);
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading members…</div>;
  if (error) return <div className="text-sm text-destructive">Members error: {error}</div>;
  if (!members.length) return <div className="text-sm text-muted-foreground">No members.</div>;

  return (
    <ul className="mt-1 space-y-2">
      {members.map((m) => (
        <li key={m.user_id} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {m.avatar_url ? (
              <img
                src={m.avatar_url}
                alt={m.display_name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (m.display_name || m.user_id).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium leading-none truncate">
              {m.display_name || m.user_id}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={m.isOwner ? "default" : "outline"}
                className="text-[10px] uppercase tracking-wide"
              >
                {roleLabel(m.role || (m.isOwner ? "owner" : null))}
              </Badge>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
