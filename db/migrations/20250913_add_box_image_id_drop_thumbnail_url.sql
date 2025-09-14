-- Migration: Add image_id to boxes and drop obsolete thumbnail_url
-- Date: 2025-09-13
-- Description:
--   Adds a new nullable UUID column image_id for referencing uploaded images.
--   Removes the legacy thumbnail_url column (no backfill required per spec).
-- Safety:
--   Column drop is irreversible; ensure no code still references boxes.thumbnail_url before applying.
-- Rollback (manual):
--   ALTER TABLE boxes ADD COLUMN thumbnail_url text;
--   ALTER TABLE boxes DROP COLUMN image_id;

BEGIN;

-- 1. Add the new image_id column (nullable for existing rows)
ALTER TABLE public.boxes
  ADD COLUMN IF NOT EXISTS image_id uuid NULL;

-- 2. Drop the old thumbnail_url column
ALTER TABLE public.boxes
  DROP COLUMN IF EXISTS thumbnail_url;

COMMIT;
