import { z } from "zod";

// Shared Zod schema for Box create/edit
export const boxFormSchema = z.object({
    name: z.string().min(2, "Name is required").max(120, "Name too long"),
    location: z.string().max(200, "Location too long").optional().or(
        z.literal(""),
    ),
    content: z.string().max(5000, "Content too long").optional().or(
        z.literal(""),
    ),
    thumbnail_url: z.string().url("Must be a valid URL").optional().or(
        z.literal(""),
    ),
});

export type BoxFormValues = z.infer<typeof boxFormSchema>;
