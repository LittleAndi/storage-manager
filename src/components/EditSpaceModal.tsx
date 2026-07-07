import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { spaceFormSchema, type SpaceFormValues } from "@/schemas/spaceSchema";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MultiImageUploadField } from "@/components/forms/MultiImageUploadField";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import type { Space } from "@/types/entities";
import { toast } from "sonner";
import { confirmImages } from "@/lib/imageUpload";
import { normalizeImageIds } from "@/lib/imageRefs";

interface EditSpaceModalProps {
  open: boolean;
  onClose: () => void;
  space: Space;
}

const EditSpaceModal: React.FC<EditSpaceModalProps> = ({ open, onClose, space }) => {
  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      name: space.name,
      location: space.location || "",
      image_id: (space as unknown as { image_id?: string }).image_id || "",
      image_ids: space.image_ids || ((space as unknown as { image_id?: string }).image_id ? [(space as unknown as { image_id?: string }).image_id as string] : []),
    },
  });

  const { mutate, loading } = useEntityUpdate<SpaceFormValues>({
    kind: "space",
    entity: space,
    onSuccess: () => toast.success("Space updated"),
    onError: (e: unknown) => toast.error(`Update failed: ${(e as Error)?.message || String(e)}`),
  });
  const [imageUploading, setImageUploading] = React.useState(false);

  async function onSubmit(values: SpaceFormValues) {
    const image_ids = normalizeImageIds(values.image_ids, values.image_id);
    await mutate({ ...values, image_id: image_ids[0] || null, image_ids } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    onClose();
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Space</AlertDialogTitle>
          <AlertDialogDescription />
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="location" render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormItem>
              <MultiImageUploadField
                name="image_ids"
                label="Space Images"
                description="Upload, change, or remove space images."
                onUploadingChange={(u) => setImageUploading(u)}
                onClear={() => {
                  form.setValue("image_id", "", { shouldDirty: true, shouldTouch: true });
                }}
                onImagesUploaded={async (results) => {
                  await confirmImages(results.map((result) => result.imageId), {
                    metadataKey: "space_id",
                    metadataValue: space.id,
                  });
                }}
              />
            </FormItem>
            <AlertDialogFooter>
              <Button
                type="submit"
                disabled={loading || imageUploading}
                aria-busy={loading || imageUploading}
              >
                {imageUploading ? "Waiting for image..." : loading ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditSpaceModal;
