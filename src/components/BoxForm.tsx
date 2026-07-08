import React from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boxFormSchema, type BoxFormValues } from "@/schemas/boxSchema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MultiImageUploadField } from "@/components/forms/MultiImageUploadField";
import { type UploadResult } from "@/lib/imageUpload";

export interface BoxFormProps {
  mode: "create" | "edit";
  open: boolean; // to allow effect resets when modal opens/closes
  initialValues?: Partial<BoxFormValues & { image_id: string | null; image_ids: string[] | null }>;
  onSubmit: (values: BoxFormValues) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  includeDescriptions?: boolean;
  onImagesUploaded?: (results: UploadResult[]) => Promise<void> | void;
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
  onSubmit,
  onCancel,
  loading,
  submitLabel,
  cancelLabel = "Cancel",
  includeDescriptions = mode === "create",
  onImagesUploaded,
  formRefCb,
}) => {
  const form = useForm<BoxFormValues>({
    resolver: zodResolver(boxFormSchema),
    defaultValues: {
      name: initialValues?.name || "",
      location: initialValues?.location || "",
      content: initialValues?.content || "",
      image_id: initialValues?.image_id || "",
      image_ids: initialValues?.image_ids || (initialValues?.image_id ? [initialValues.image_id] : []),
    },
  });
  const [imageUploading, setImageUploading] = React.useState(false);

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
        image_ids: initialValues?.image_ids || (initialValues?.image_id ? [initialValues.image_id] : []),
      });
    }
  }, [open, initialValues, form]);

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
          <MultiImageUploadField
            name="image_ids"
            label={mode === "create" ? "Box Images (optional)" : "Box Images"}
            description={mode === "create" ? "Upload one or more optional images for this box." : "Upload, change, or remove box images."}
            onUploadingChange={(u) => setImageUploading(u)}
            onClear={() => {
              form.setValue("image_id", "", { shouldDirty: true, shouldTouch: true });
            }}
            onImagesUploaded={onImagesUploaded}
          />
        </div>
        <div className="sticky bottom-0 bg-background pt-2 flex gap-2 justify-end">
            <Button type="submit" disabled={loading || imageUploading} aria-busy={loading || imageUploading}>
              {imageUploading
                ? "Waiting for image..."
                : loading
                  ? (mode === "create" ? "Creating..." : "Saving...")
                  : (submitLabel || (mode === "create" ? "Create" : "Save"))}
            </Button>          
          <Button type="button" variant="outline" onClick={onCancel}>{cancelLabel}</Button>
        </div>
      </form>
    </Form>
  );
};
