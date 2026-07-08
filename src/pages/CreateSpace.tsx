import React from "react";
import AppShell from "../components/AppShell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { MultiImageUploadField } from "@/components/forms/MultiImageUploadField";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useSpacesStore } from "@/state/spacesStore";
import type { NewSpace } from "@/types/entities";
import { useAuthStore } from "@/state/authStore";
import { useNavigate } from "react-router-dom";

import { spaceFormSchema, type SpaceFormValues } from "@/schemas/spaceSchema";
import { normalizeImageIds } from "@/lib/imageRefs";

const CreateSpace: React.FC = () => {
  const form = useForm<SpaceFormValues>({ resolver: zodResolver(spaceFormSchema), defaultValues: { name: "", location: "", image_id: "", image_ids: [] } });
  const { handleSubmit, formState: { isSubmitting }, reset } = form;
  const navigate = useNavigate();
  const addSpace = useSpacesStore(state => state.addSpace);
  const [imageUploading, setImageUploading] = React.useState(false);
  const onSubmit = async (data: SpaceFormValues) => {
    // Save to local state and Supabase
    const owner_id = useAuthStore.getState().user!.id;
    const image_ids = normalizeImageIds(data.image_ids, data.image_id);
    const newSpace: NewSpace = {
      name: data.name,
      location: data.location,
      // Persist the image id (if uploaded) instead of the full URL
      image_id: image_ids[0],
      image_ids,
      owner_id,
    };
    const id = await addSpace(newSpace);
    if (id) {
      toast.success("Space created successfully!");
      reset();
      navigate(`/spaces/${id}`);
    } else {
      toast.error("Failed to create space.");
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">Create Storage Space</h1>
      <Card className="w-full max-w-md mb-4">
        <CardHeader>
          <CardTitle>New Storage Space</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="name">Name</FormLabel>
                    <FormControl>
                      <Input id="name" type="text" {...field} aria-label="Space name" />
                    </FormControl>
                    {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                  </FormItem>
                )}
              />
              <FormField
                name="location"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="location">Location</FormLabel>
                    <FormControl>
                      <Input id="location" type="text" {...field} aria-label="Location" />
                    </FormControl>
                    {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                  </FormItem>
                )}
              />
              <FormItem>
                <MultiImageUploadField
                  name="image_ids"
                  label="Space Images (optional)"
                  description="Upload one or more optional images for this space."
                  onUploadingChange={(u) => setImageUploading(u)}
                />
              </FormItem>
            </CardContent>
            <div className="h-4" />
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || imageUploading} aria-busy={isSubmitting || imageUploading}>
                {imageUploading ? "Waiting for image..." : isSubmitting ? "Creating..." : "Create Space"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AppShell>
  );
};

export default CreateSpace;
