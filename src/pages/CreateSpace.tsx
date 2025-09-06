import React from "react";
import AppShell from "../components/AppShell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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

// Helper to get a random UUID (browser native when available)
const makeId = () => {
  if (typeof crypto !== "undefined") {
    const c = crypto as unknown as { randomUUID?: () => string };
    if (typeof c.randomUUID === "function") return c.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const CreateSpace: React.FC = () => {
  const form = useForm<SpaceFormValues>({ resolver: zodResolver(spaceFormSchema), defaultValues: { name: "", location: "", thumbnail_url: "", image_id: "" } });
  const { handleSubmit, formState: { isSubmitting }, reset } = form;
  const thumbnailUrl = form.watch("thumbnail_url");
  const navigate = useNavigate();
  const addSpace = useSpacesStore(state => state.addSpace);

  const onSubmit = async (data: SpaceFormValues) => {
    // Save to local state and Supabase
    const owner_id = useAuthStore.getState().user!.id;
    const newSpace: NewSpace = {
      name: data.name,
      location: data.location,
      // Persist the image id (if uploaded) instead of the full URL
      image_id: data.image_id ?? undefined,
      thumbnail_url: data.thumbnail_url,
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

  // Handle image file selection + upload
  const handleImageFile = async (file?: File | null): Promise<{ imageId: string; previewUrl?: string } | undefined> => {
    if (!file) return undefined;

    const imageId = makeId();
    // Upload the file using the server-side UploadImage endpoint (multipart form)
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);

      // POST directly to /api/images/{imageId} which the function now supports
      const resp = await fetch(`/api/images/${encodeURIComponent(imageId)}`, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        console.error("Upload endpoint returned error", await resp.text());
        toast.error("Image upload failed");
        return undefined;
      }

      const body = await resp.json();
      const returnedImageId: string | undefined = body?.image_id;
      const previewFromApi: string | undefined = body?.preview_url;

      return { imageId: returnedImageId ?? imageId, previewUrl: previewFromApi };
    } catch (err: unknown) {
      console.error(err);
      toast.error("Image upload failed");
      return undefined;
    }
  };

  // Wire file input change: upload and set thumbnail_url form field
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const result = await handleImageFile(f);
    if (result) {
      form.setValue("image_id", result.imageId, { shouldDirty: true, shouldTouch: true });
      if (result.previewUrl) form.setValue("thumbnail_url", result.previewUrl, { shouldDirty: true, shouldTouch: true });
      toast.success("Image uploaded");
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
              {/* Thumbnail image file input (uploads to storage) */}
              <FormItem>
                <FormLabel>Thumbnail Image (optional)</FormLabel>
                <FormControl>
                  <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFileChange}
                  className="block w-full text-sm text-slate-700"
                  />
                </FormControl>
                {thumbnailUrl && (
                  <div className="mt-2">
                    <img src={thumbnailUrl} alt="thumbnail preview" className="w-32 h-32 rounded object-cover" />
                  </div>
                )}
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
