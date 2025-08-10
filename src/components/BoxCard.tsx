import React from "react";

export interface BoxCardProps {
  id: string;
  name: string;
  location?: string;
  itemCount?: number;
  thumbnailUrl?: string;
  onOpen?: () => void;
}

const BoxCard: React.FC<BoxCardProps> = ({ id, name, location, itemCount, thumbnailUrl, onOpen }) => (
  <div className="bg-white rounded shadow p-4 flex items-center cursor-pointer" onClick={onOpen} aria-label={`Open box ${name}`}>
    {thumbnailUrl && <img src={thumbnailUrl} alt={name} className="w-12 h-12 rounded mr-4" />}
    <div className="flex-1">
      <h3 className="text-md font-semibold">{name}</h3>
      <p className="text-xs text-gray-500">{location}</p>
      <p className="text-xs text-gray-400">Items: {itemCount}</p>
    </div>
  </div>
);

export default BoxCard;
