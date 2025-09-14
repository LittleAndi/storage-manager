import React from "react";
import { useBoxesStore } from "@/state/boxesStore";
import type { BoxFormValues } from "@/schemas/boxSchema";
import type { NewBox } from "@/types/entities";
import { useNavigate, useParams } from "react-router-dom";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { BoxForm } from "./BoxForm";

interface CreateBoxModalProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: { name: string; location?: string; content?: string }) => void;
}

const CreateBoxModal: React.FC<CreateBoxModalProps> = ({ open, onClose, onCreate }) => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const addBox = useBoxesStore((state) => state.addBox);

  const handleSubmit = async (values: BoxFormValues) => {
    if (!spaceId) return;
    const newBox: NewBox = {
      name: values.name,
      location: values.location,
      space_id: spaceId,
      content: values.content,
      image_id: values.image_id || undefined,
    };
    await addBox(newBox);
    if (onCreate) onCreate(values);
    onClose();
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
      <AlertDialogContent className="max-h-[90svh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Box</AlertDialogTitle>
          <AlertDialogDescription />
        </AlertDialogHeader>
        <BoxForm
          mode="create"
          open={open}
            /* initialValues empty by design for create */
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateBoxModal;
