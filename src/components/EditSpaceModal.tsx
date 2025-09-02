import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { spaceFormSchema, type SpaceFormValues } from "@/schemas/spaceSchema";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useEntityUpdate } from "@/hooks/useEntityUpdate";
import type { Space } from "@/types/entities";
import { toast } from "sonner";

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
      thumbnail_url: space.thumbnail_url || "",
    },
  });

  const { mutate, loading } = useEntityUpdate<SpaceFormValues>({
    kind: "space",
    entity: space,
    onSuccess: () => toast.success("Space updated"),
    onError: (e: unknown) => toast.error(`Update failed: ${(e as Error)?.message || String(e)}`),
  });

  async function onSubmit(values: SpaceFormValues) {
    await mutate(values);
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

export default EditSpaceModal;
