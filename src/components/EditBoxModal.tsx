import React from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import type { Box } from "@/types/entities";
import type { BoxFormValues } from "@/schemas/boxSchema";
import { toast } from "sonner";
import { BoxForm } from "./BoxForm";
import { confirmImages } from "@/lib/imageUpload";
import { normalizeImageIds } from "@/lib/imageRefs";

interface EditBoxModalProps {
  open: boolean;
  onClose: () => void;
  box: Box;
}

const EditBoxModal: React.FC<EditBoxModalProps> = ({ open, onClose, box }) => {
  // Form logic moved to shared BoxForm component with preloading built-in.

  const { mutate, loading } = useEntityUpdate<BoxFormValues>({
    kind: "box",
    entity: box,
    onSuccess: () => toast.success("Box updated"),
    onError: (e: unknown) => toast.error(`Update failed: ${(e as Error)?.message || String(e)}`),
  });

  async function onSubmit(values: BoxFormValues) {
    const image_ids = normalizeImageIds(values.image_ids);
    await mutate({ ...values, image_id: image_ids[0] || null, image_ids } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    onClose();
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-h-[90svh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Box</AlertDialogTitle>
          <AlertDialogDescription />
        </AlertDialogHeader>
        <BoxForm
          mode="edit"
          open={open}
          initialValues={{
            name: box.name,
            location: box.location || "",
            content: box.content || "",
            image_id: box.image_id || "",
            image_ids: box.image_ids || (box.image_id ? [box.image_id] : []),
          }}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
          submitLabel="Save"
          includeDescriptions={false}
          onImagesUploaded={async (results) => {
            await confirmImages(results.map((result) => result.imageId), {
              metadataKey: "box_id",
              metadataValue: box.id,
            });
          }}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditBoxModal;
