import React from "react";
import AppShell from "../components/AppShell";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const GetStarted: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">Get Started</h1>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 mb-4 w-full max-w-lg mx-auto">
          <Button
            className="flex-1 py-8 text-lg rounded-xl shadow-md bg-primary text-primary-foreground"
            onClick={() => navigate("/spaces")}
          >
            View Spaces
          </Button>
          <Button
            className="flex-1 py-8 text-lg rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate("/spaces/new")}
          >
            + Create New Space
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default GetStarted;
