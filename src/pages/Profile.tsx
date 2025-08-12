
import React from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../state/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      {user ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.name || user.email} />
                <AvatarFallback>{(user.name || user.email)?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <span className="block text-lg font-semibold">{user.name || user.email}</span>
                <span className="block text-sm text-gray-500">{user.email}</span>
              </div>
            </div>
            <div>
              <span className="font-semibold">Roles:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role, idx) => (
                    <Badge key={idx} variant="secondary">{role}</Badge>
                  ))
                ) : (
                  <Badge variant="outline">No roles assigned</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center text-gray-500">Not logged in.</CardContent>
        </Card>
      )}
    </AppShell>
  );
};

export default Profile;
