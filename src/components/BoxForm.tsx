import React from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boxFormSchema, type BoxFormValues } from "@/schemas/boxSchema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { resolveImageUrl } from "@/lib/imageUrls";

export interface BoxFormProps {
  mode: "create" | "edit";
  open: boolean; // to allow effect resets when modal opens/closes
  initialValues?: Partial<BoxFormValues & { image_id: string | null }>;
  existingImageId?: string | null; // for edit preload
  onSubmit: (values: BoxFormValues) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  includeDescriptions?: boolean;
  // Allow parent to receive form ref if needed
  formRefCb?: (form: UseFormReturn<BoxFormValues>) => void;
}

/**
 * Shared create/edit Box form with image upload handling and scroll-friendly layout.
 * Keeps sticky footer actions and allows parent modals to wrap it.
 */
export const BoxForm: React.FC<BoxFormProps> = ({
  mode,
  open,
  initialValues,
  existingImageId,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
  cancelLabel = "Cancel",
  includeDescriptions = mode === "create",
  formRefCb,
}) => {
  const form = useForm<BoxFormValues>({
    resolver: zodResolver(boxFormSchema),
    defaultValues: {
      name: initialValues?.name || "",
      location: initialValues?.location || "",
      content: initialValues?.content || "",
      image_id: initialValues?.image_id || "",
    },
  });

  // Expose form instance
  React.useEffect(() => { formRefCb?.(form); }, [form, formRefCb]);

  // Reset when opening with different initial box (e.g., switching edit target)
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name || "",
        location: initialValues?.location || "",
        content: initialValues?.content || "",
        image_id: initialValues?.image_id || "",
      });
    }
  }, [open, initialValues, form]);

  // Preload existing image preview for edit mode
  React.useEffect(() => {
    let active = true;
    if (mode === "edit" && existingImageId) {
      resolveImageUrl(existingImageId)
        .then((url) => {
          if (!active) return;
          if (url) {
            // Setting a transient field name for ImageUploadField; not part of zod schema.
            form.setValue("image_upload_ui" as any, { image_id: existingImageId, preview_url: url }, { shouldDirty: false, shouldTouch: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
            form.setValue("image_id", existingImageId, { shouldDirty: false, shouldTouch: false });
          }
        })
        .catch((e) => console.warn("Failed to resolve existing box image", e));
    }
    return () => { active = false; };
  }, [mode, existingImageId, form]);

  const handleSubmit = async (values: BoxFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto pr-1 -mr-1 flex-1">
        <FormField name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>{mode === "create" ? "Box Name" : "Name"}</FormLabel>
            <FormControl>
              <Input placeholder={mode === "create" ? "Enter box name" : undefined} {...field} autoFocus={mode === "create"} />
            </FormControl>
            {includeDescriptions && <FormDescription>Required. Give your box a descriptive name.</FormDescription>}
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="location" render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder={includeDescriptions ? "Enter location (optional)" : undefined} {...field} />
            </FormControl>
            {includeDescriptions && <FormDescription>Optional. Where is this box stored?</FormDescription>}
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="content" render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <Textarea placeholder={includeDescriptions ? "Enter box content (optional)" : undefined} {...field} rows={5} />
            </FormControl>
            {includeDescriptions && <FormDescription>Optional. What does this box contain?</FormDescription>}
            <FormMessage />
          </FormItem>
        )} />
        <div>
          <ImageUploadField
            name="image_upload_ui"
            label={mode === "create" ? "Box Image (optional)" : "Box Image"}
            description={mode === "create" ? "Upload an optional image for this box." : "Upload, change, or remove the box image."}
            variant="simple"
            canClear={mode === "edit"}
            onUploaded={(r) => {
              form.setValue("image_id", r.imageId, { shouldDirty: true, shouldTouch: true });
            }}
            onClear={() => {
              form.setValue("image_id", "", { shouldDirty: true, shouldTouch: true });
            }}
          />
        </div>
        <div className="sticky bottom-0 bg-background pt-2 flex gap-2 justify-end">
          <Button type="submit" disabled={loading}>{loading ? (mode === "create" ? "Creating..." : "Saving...") : (submitLabel || (mode === "create" ? "Create" : "Save"))}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>{cancelLabel}</Button>
        </div>
      </form>
    </Form>
  );
};
