import React from "react";

export interface Activity {
  id: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => (
  <ul className="divide-y divide-gray-200">
    {activities.map(a => (
      <li key={a.id} className="p-2">
        <span className="font-medium">{a.description}</span>
        <span className="text-xs text-gray-400 ml-2">{a.timestamp}</span>
      </li>
    ))}
  </ul>
);

export default ActivityFeed;
