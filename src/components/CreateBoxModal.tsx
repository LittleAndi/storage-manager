import React, { useState } from "react";
import { useBoxesStore } from "@/state/boxesStore";
import type { NewBox } from "@/types/entities";
import { useNavigate, useParams } from "react-router-dom";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateBoxModalProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: { name: string; location: string; content?: string }) => void;
}

const CreateBoxModal: React.FC<CreateBoxModalProps> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const addBox = useBoxesStore((state) => state.addBox);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId) return;
    // Save box using store
    const newBox: NewBox = {
      name,
      location,
      space_id: spaceId,
      content,
    };
    await addBox(newBox);
    if (onCreate) onCreate({ name, location, content });
    setName("");
    setLocation("");
    setContent("");
    onClose();
    // Optionally navigate to the new box detail page after creation
  };

  const handleClose = () => {
    onClose();
    // If opened via route, navigate back to space detail
    if (window.location.pathname.endsWith("/boxes/new")) {
      navigate(`/spaces/${spaceId}`);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Box</AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="box-name" className="block text-sm font-medium mb-1">Box Name</label>
            <Input
              id="box-name"
              placeholder="Enter box name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="box-location" className="block text-sm font-medium mb-1">Location</label>
            <Input
              id="box-location"
              placeholder="Enter location (optional)"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="box-content" className="block text-sm font-medium mb-1">Content</label>
            <textarea
              id="box-content"
              placeholder="Enter box content (optional)"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ resize: "vertical" }}
            />
          </div>
          <AlertDialogFooter>
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateBoxModal;
