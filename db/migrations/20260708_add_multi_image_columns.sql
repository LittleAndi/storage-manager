-- Add multi-image support while keeping legacy single-image columns during rollout.

ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS image_id uuid,
  ADD COLUMN IF NOT EXISTS image_ids uuid[] DEFAULT '{}'::uuid[];

ALTER TABLE public.boxes
  ADD COLUMN IF NOT EXISTS image_ids uuid[] DEFAULT '{}'::uuid[];

UPDATE public.spaces
SET image_ids = CASE
  WHEN image_id IS NULL THEN COALESCE(image_ids, '{}'::uuid[])
  ELSE ARRAY[image_id]::uuid[]
END
WHERE COALESCE(array_length(image_ids, 1), 0) = 0;

UPDATE public.boxes
SET image_ids = CASE
  WHEN image_id IS NULL THEN COALESCE(image_ids, '{}'::uuid[])
  ELSE ARRAY[image_id]::uuid[]
END
WHERE COALESCE(array_length(image_ids, 1), 0) = 0;