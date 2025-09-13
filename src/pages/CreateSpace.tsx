import React from "react";
import AppShell from "../components/AppShell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
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

const CreateSpace: React.FC = () => {
  const form = useForm<SpaceFormValues>({ resolver: zodResolver(spaceFormSchema), defaultValues: { name: "", location: "", image_id: "" } });
  const { handleSubmit, formState: { isSubmitting }, reset } = form;
  const navigate = useNavigate();
  const addSpace = useSpacesStore(state => state.addSpace);

  const onSubmit = async (data: SpaceFormValues) => {
    // Save to local state and Supabase
    const owner_id = useAuthStore.getState().user!.id;
    const newSpace: NewSpace = {
      name: data.name,
      location: data.location,
      // Persist the image id (if uploaded) instead of the full URL
      image_id: data.image_id || undefined,
      owner_id,
    };
    const id = await addSpace(newSpace);
    if (id) {
      // If an image was uploaded, confirm it by adding metadata linking it to this space
      if (data.image_id) {
        try {
          // Confirm image by updating metadata on the image resource
          const confirmResp = await fetch(`/api/images/${encodeURIComponent(data.image_id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metadata_key: "space_id", metadata_value: id }),
          });
          if (!confirmResp.ok) {
            console.error("Failed to confirm image", await confirmResp.text());
            toast.error("Image confirmation failed (metadata). The space was created though.");
          }
        } catch (err) {
          console.error("Error confirming image:", err);
          toast.error("Image confirmation failed (network). The space was created though.");
        }
      }
      toast.success("Space created successfully!");
      reset();
      navigate(`/spaces/${id}`);
    } else {
      toast.error("Failed to create space.");
    }
  };

  // Removed inline upload logic in favor of shared ImageUploadField

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
                <ImageUploadField
                  name="space_image_upload"
                  label="Space Image (optional)"
                  variant="simple"
                  description="Upload an optional image for this space."
                  onUploaded={(r) => {
                    form.setValue("image_id", r.imageId, { shouldDirty: true, shouldTouch: true });
                    toast.success("Image uploaded");
                  }}
                />
              </FormItem>
            </CardContent>
            <div className="h-4" />
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Space"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AppShell>
  );
};

export default CreateSpace;
