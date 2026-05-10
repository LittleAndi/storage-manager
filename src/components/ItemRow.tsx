import React from "react";

export interface ItemRowProps {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  thumbnailUrl?: string;
  onOpen?: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ name, description, quantity, thumbnailUrl, onOpen }) => (
  <li
    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
    onClick={onOpen}
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
    aria-label={`Open item ${name}`}
  >
    {/* Thumbnail */}
    <div className="size-10 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center text-muted-foreground/30">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      )}
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium leading-snug line-clamp-1">{name}</p>
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{description}</p>
      )}
    </div>

    {/* Quantity */}
    {typeof quantity === "number" && (
      <span className="text-sm font-medium text-muted-foreground tabular-nums shrink-0">
        ×{quantity}
      </span>
    )}
  </li>
);

export default ItemRow;
