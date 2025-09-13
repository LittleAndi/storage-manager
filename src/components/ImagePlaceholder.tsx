import React from "react";

interface ImagePlaceholderProps {
  className?: string;
  loading?: boolean;
  label?: string;
  square?: boolean;
}

/**
 * Simple reusable image placeholder / skeleton.
 * Use `loading` for animated pulse while fetching.
 */
export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ className = "", loading, label, square = true }) => {
  return (
    <div
      className={[
        "bg-gray-200 text-gray-400 flex items-center justify-center overflow-hidden select-none",
        square ? "aspect-square" : "",
        loading ? "animate-pulse" : "",
        className,
      ].join(" ")}
      aria-label={label || (loading ? "Loading image" : "No image")}
    >
      {!loading && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="w-6 h-6 opacity-40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      )}
    </div>
  );
};

export default ImagePlaceholder;