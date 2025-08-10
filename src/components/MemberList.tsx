import React from "react";

export interface Member {
  id: string;
  name: string;
  role: "Owner" | "Editor" | "Viewer";
}

export interface MemberListProps {
  members: Member[];
}

const MemberList: React.FC<MemberListProps> = ({ members }) => (
  <ul className="divide-y divide-gray-200">
    {members.map((m) => (
      <li key={m.id} className="flex justify-between items-center p-2">
        <span>{m.name}</span>
        <span className="text-xs px-2 py-1 rounded bg-gray-200">{m.role}</span>
      </li>
    ))}
  </ul>
);

export default MemberList;
