import React from "react";
import { Label } from "@/components/Label";
import type { Box } from "@/types/entities";
import "./LabelSheet.css";

interface LabelSheetProps {
  boxes: Box[];
  spaceId?: string;
}

export const LabelSheet: React.FC<LabelSheetProps> = ({ boxes, spaceId }) => {
  // Determine spaceId: prefer prop, otherwise try to extract from current path
  let sid = spaceId;
  if (!sid) {
    const m = window.location.pathname.match(/\/spaces\/([^/]+)/);
    if (m) sid = m[1];
  }

  const origin = window.location.origin;

  return (
    <div className="labelsheet">
      {boxes.map((box, idx) => {
        const sidForUrl = sid ?? "";
        const url = sidForUrl ? `${origin}/spaces/${sidForUrl}/boxes/${box.id}` : `${origin}/boxes/${box.id}`;
        return (
          <Label
            key={box.id ?? idx}
            text={box.name}
            url={url}
          />
        );
      })}
    </div>
  );
};
