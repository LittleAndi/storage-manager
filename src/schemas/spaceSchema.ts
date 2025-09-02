import { z } from "zod";

// Shared Zod schema for Space create/edit
export const spaceFormSchema = z.object({
    name: z.string().min(2, "Name is required").max(120, "Name too long"),
    location: z.string().min(2, "Location is required").max(
        200,
        "Location too long",
    ),
    // Optional URL field; empty string coerced to undefined
    thumbnail_url: z.string().url("Must be a valid URL").optional().or(
        z.literal(""),
    ),
});

export type SpaceFormValues = z.infer<typeof spaceFormSchema>;
