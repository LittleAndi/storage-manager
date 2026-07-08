import { z } from "zod";

// Shared Zod schema for Space create/edit
export const spaceFormSchema = z.object({
  name: z.string().min(2, "Name is required").max(120, "Name too long"),
  location: z
    .string()
    .min(2, "Location is required")
    .max(200, "Location too long"),
  // Optional image id for uploaded thumbnails (we persist this instead of the full URL)
  image_id: z.string().optional().or(z.literal("")),
  image_ids: z.array(z.string()).optional(),
});

export type SpaceFormValues = z.infer<typeof spaceFormSchema>;
