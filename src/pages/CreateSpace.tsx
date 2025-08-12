import React from "react";
import AppShell from "../components/AppShell";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useAuthStore } from "@/state/authStore";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  location: z.string().min(2, "Location is required"),
  photo: z.instanceof(File).optional().or(z.string().optional()),
});

type FormData = z.infer<typeof schema>;

const CreateSpace: React.FC = () => {
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: {
    name: "",
    location: "",
  } });
  const { handleSubmit, formState: { isSubmitting }, reset } = form;
  const navigate = useNavigate();
  const addSpace = useSpacesStore(state => state.addSpace);

  const onSubmit = async (data: FormData) => {
    // Save to local state
    const newSpace = {
      id: Math.random().toString(36).slice(2), // simple unique id
      name: data.name,
      location: data.location,
      thumbnailUrl: typeof data.photo === "string" ? data.photo : undefined,
      memberCount: 1,
      owner: useAuthStore.getState().user?.name || "You",
    };
    addSpace(newSpace);
    toast.success("Space created successfully!");
    reset();
    navigate(`/spaces/${newSpace.id}`);
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
              <FormField
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="photo">Photo (optional)</FormLabel>
                    <FormControl>
                      <Input
                        id="photo"
                        type="file"
                        aria-label="Photo upload"
                        accept="image/*"
                        onChange={e => {
                          field.onChange(e.target.files?.[0] ?? undefined);
                        }}
                        ref={field.ref}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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
