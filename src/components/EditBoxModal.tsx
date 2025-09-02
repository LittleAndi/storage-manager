import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boxFormSchema, type BoxFormValues } from "@/schemas/boxSchema";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
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
      thumbnail_url: box.thumbnail_url || "",
    },
  });

  const { mutate, loading } = useEntityUpdate<BoxFormValues>({
    kind: "box",
    entity: box,
    onSuccess: () => toast.success("Box updated"),
    onError: (e: unknown) => toast.error(`Update failed: ${(e as Error)?.message || String(e)}`),
  });

  async function onSubmit(values: BoxFormValues) {
    await mutate(values);
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
            <FormField name="thumbnail_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
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
