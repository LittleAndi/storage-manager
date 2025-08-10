import React from "react";

export interface SpaceCardProps {
  id: string;
  name: string;
  location?: string;
  memberCount?: number;
  owner?: string;
  thumbnailUrl?: string;
  onOpen?: () => void;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ id, name, location, memberCount, owner, thumbnailUrl, onOpen }) => (
  <div className="bg-white rounded shadow p-4 flex items-center cursor-pointer" onClick={onOpen} aria-label={`Open space ${name}`}>
    {thumbnailUrl && <img src={thumbnailUrl} alt={name} className="w-16 h-16 rounded mr-4" />}
    <div className="flex-1">
      <h2 className="text-lg font-bold">{name}</h2>
      <p className="text-sm text-gray-500">{location}</p>
      <p className="text-xs text-gray-400">Members: {memberCount} | Owner: {owner}</p>
    </div>
  </div>
);

export default SpaceCard;
