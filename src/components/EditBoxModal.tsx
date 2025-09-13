import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boxFormSchema, type BoxFormValues } from "@/schemas/boxSchema";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { resolveImageUrl } from "@/lib/imageUrls";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import type { Box } from "@/types/entities";
import { toast } from "sonner";

interface EditBoxModalProps {
  open: boolean;
  onClose: () => void;
  box: Box;
}

const EditBoxModal: React.FC<EditBoxModalProps> = ({ open, onClose, box }) => {
  const form = useForm<BoxFormValues>({
    resolver: zodResolver(boxFormSchema),
    defaultValues: {
      name: box.name,
      location: box.location || "",
      content: box.content || "",
      image_id: box.image_id || "",
    },
  });

  // Pre-populate upload field with existing image (so ImageUploadField shows it) then it will replace on new upload.
  React.useEffect(() => {
    let active = true;
    if (box.image_id) {
      resolveImageUrl(box.image_id).then(url => {
        if (active && url) {
          form.setValue('image_upload_internal' as any, { image_id: box.image_id, preview_url: url }, { shouldDirty: false, shouldTouch: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
          form.setValue('image_id', box.image_id!, { shouldDirty: false, shouldTouch: false });
        }
      }).catch(e => console.warn('Failed to resolve existing box image', e));
    }
    return () => { active = false; };
  }, [box.image_id, form]);

  const { mutate, loading } = useEntityUpdate<BoxFormValues>({
    kind: "box",
    entity: box,
    onSuccess: () => toast.success("Box updated"),
    onError: (e: unknown) => toast.error(`Update failed: ${(e as Error)?.message || String(e)}`),
  });

  async function onSubmit(values: BoxFormValues) {
    const image_id = values.image_id ? values.image_id : null;
    await mutate({ ...values, image_id } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    onClose();
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Box</AlertDialogTitle>
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
            <FormField name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {/* Image editing: single preview managed by ImageUploadField */}
            <div>
              {/* We pass a field name that exists in the schema: reuse image_id but keep preview ephemeral by wrapping inside object field not saved */}
              <ImageUploadField
                name="image_upload_internal"
                label="Box Image"
                description="Upload, change, or remove the box image."
                variant="simple"
                canClear={true}
                onUploaded={(r) => {
                  form.setValue('image_id', r.imageId, { shouldDirty: true, shouldTouch: true });
                }}
                onClear={() => {
                  form.setValue('image_id', '', { shouldDirty: true, shouldTouch: true });
                }}
              />
            </div>
            <AlertDialogFooter>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditBoxModal;
