
import React from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../state/authStore";

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      {user ? (
        <div className="bg-white rounded shadow p-6 max-w-md mx-auto">
          <div className="mb-4">
            <span className="block text-lg font-semibold">{user.name || user.email}</span>
            <span className="block text-sm text-gray-500">{user.email}</span>
          </div>
          <div>
            <span className="font-semibold">Roles:</span>
            <ul className="list-disc ml-6 mt-1">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role, idx) => (
                  <li key={idx} className="text-sm">{role}</li>
                ))
              ) : (
                <li className="text-sm text-gray-400">No roles assigned</li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">Not logged in.</div>
      )}
    </AppShell>
  );
};

export default Profile;
