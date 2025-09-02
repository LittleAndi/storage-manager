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

const CreateSpace: React.FC = () => {
  const form = useForm<SpaceFormValues>({ resolver: zodResolver(spaceFormSchema), defaultValues: { name: "", location: "", thumbnail_url: "" } });
  const { handleSubmit, formState: { isSubmitting }, reset } = form;
  const navigate = useNavigate();
  const addSpace = useSpacesStore(state => state.addSpace);

  const onSubmit = async (data: SpaceFormValues) => {
    // Save to local state and Supabase
    const owner_id = useAuthStore.getState().user!.id;
    const newSpace: NewSpace = {
      name: data.name,
      location: data.location,
      thumbnail_url: data.thumbnail_url,
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
              {/* Thumbnail URL input (simple) */}
              <FormField name="thumbnail_url" render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="thumbnail_url">Thumbnail URL (optional)</FormLabel>
                  <FormControl>
                    <Input id="thumbnail_url" type="text" placeholder="https://..." {...field} />
                  </FormControl>
                </FormItem>
              )} />
            </CardContent>
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
