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

  const { mutate, loading } = useEntityUpdate<BoxFormValues>({
    kind: "box",
    entity: box,
    onSuccess: () => toast.success("Box updated"),
    onError: (e: unknown) => toast.error(`Update failed: ${(e as Error)?.message || String(e)}`),
  });

  async function onSubmit(values: BoxFormValues) {
    await mutate({ ...values, image_id: values.image_id || undefined });
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
            {/* Image editing: reuse upload field; on upload set image_id */}
            <div>
              <ImageUploadField
                name="edit_image_upload"
                label="Box Image"
                description="Upload or replace the box image."
                onUploaded={(r) => form.setValue("image_id", r.imageId, { shouldDirty: true, shouldTouch: true })}
              />
              {box.image_id && !form.watch("image_id") && (
                <p className="text-xs text-muted-foreground mt-1">Existing image will remain unless replaced.</p>
              )}
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
