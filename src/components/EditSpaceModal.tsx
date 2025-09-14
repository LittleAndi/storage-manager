import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { spaceFormSchema, type SpaceFormValues } from "@/schemas/spaceSchema";

// Extend form values locally to optionally include image_id during transition.
type SpaceFormValuesWithImage = SpaceFormValues & { image_id?: string };
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { resolveImageUrl } from "@/lib/imageUrls";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import type { Space } from "@/types/entities";
import { toast } from "sonner";

interface EditSpaceModalProps {
  open: boolean;
  onClose: () => void;
  space: Space;
}

const EditSpaceModal: React.FC<EditSpaceModalProps> = ({ open, onClose, space }) => {
  const form = useForm<SpaceFormValuesWithImage>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      name: space.name,
      location: space.location || "",
      image_id: (space as unknown as { image_id?: string }).image_id || "",
    },
  });
  // Existing image preview now handled directly by ImageUploadField via form state; no local preview state needed.

  React.useEffect(() => {
    let active = true;
    async function load() {
      const imgId = (space as unknown as { image_id?: string }).image_id;
      if (imgId) {
        try {
          const url = await resolveImageUrl(imgId);
          if (active && url) {
            // Prime form value so ImageUploadField shows existing image (ephemeral preview only)
            form.setValue("edit_space_image_upload" as any, { image_id: imgId, preview_url: url }, { shouldDirty: false, shouldTouch: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
            form.setValue("image_id", imgId, { shouldDirty: false, shouldTouch: false });
          }
        } catch (e) {
          console.warn("Failed to resolve existing space image", e);
        }
      }
    }
    load();
    return () => { active = false; };
  }, [space, form]);

  const { mutate, loading } = useEntityUpdate<SpaceFormValues>({
    kind: "space",
    entity: space,
    onSuccess: () => toast.success("Space updated"),
    onError: (e: unknown) => toast.error(`Update failed: ${(e as Error)?.message || String(e)}`),
  });
  const [imageUploading, setImageUploading] = React.useState(false);

  async function onSubmit(values: SpaceFormValuesWithImage) {
    // If cleared (empty string) we explicitly send null so DB sets it to null
    const image_id = values.image_id ? values.image_id : null;
    await mutate({ ...values, image_id } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
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
            {/* Image upload field with single preview */}
            <FormItem>
              <ImageUploadField
                name="edit_space_image_upload"
                label="Space Image"
                description="Upload, change, or remove the space image."
                variant="simple"
                canClear={true}
                onUploadingChange={(u) => setImageUploading(u)}
                onUploaded={(r) => {
                  form.setValue("image_id", r.imageId, { shouldDirty: true, shouldTouch: true });
                }}
                onClear={() => {
                  form.setValue("image_id", "", { shouldDirty: true, shouldTouch: true });
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
