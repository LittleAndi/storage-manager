import React from "react";

export interface ItemRowProps {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  thumbnailUrl?: string;
  onOpen?: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ id, name, description, quantity, thumbnailUrl, onOpen }) => (
  <div className="flex items-center p-2 border-b cursor-pointer" onClick={onOpen} aria-label={`Open item ${name}`}>
    {thumbnailUrl && <img src={thumbnailUrl} alt={name} className="w-8 h-8 rounded mr-2" />}
    <div className="flex-1">
      <span className="font-medium">{name}</span>
      <span className="text-xs text-gray-500 ml-2">{description}</span>
    </div>
    <span className="text-xs text-gray-400">Qty: {quantity}</span>
  </div>
);

export default ItemRow;
