-- Enable pgcrypto for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: spaces
CREATE TABLE spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  owner_id uuid not null default auth.uid (),
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now(),
  owner text null,
  constraint spaces_owner_id_fkey foreign KEY (owner_id) references auth.users (id)
);

-- Table: boxes
CREATE TABLE boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  space_id uuid REFERENCES spaces(id) NOT NULL,
  location text,
  content text,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now()
);

-- Table: items
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  box_id uuid REFERENCES boxes(id) NOT NULL,
  description text,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now()
);

-- Table: space_members (for sharing spaces)
CREATE TABLE space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text DEFAULT 'viewer', -- e.g., viewer, editor
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now(),
  UNIQUE (space_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- Create a function to set the owner full name
CREATE OR REPLACE FUNCTION set_space_owner_full_name()
RETURNS TRIGGER
SECURITY definer
AS $$
BEGIN
  UPDATE spaces
  SET owner = u.raw_user_meta_data->>'full_name'
  FROM auth.users u
  WHERE spaces.id = NEW.id
    AND u.id = NEW.owner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function after insert or update
DROP TRIGGER IF EXISTS trg_set_space_owner_full_name ON spaces;

CREATE TRIGGER trg_set_space_owner_full_name
AFTER INSERT ON spaces
FOR EACH ROW
EXECUTE FUNCTION set_space_owner_full_name();

-- Space members
CREATE OR REPLACE FUNCTION public.add_space_member(
    p_user_email text, 
    p_space_id uuid, 
    p_member_role text DEFAULT 'member'
)
RETURNS boolean
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE 
    is_space_owner boolean;
    target_user_id uuid;
    requesting_user_id uuid;
    existing_member_count integer;
BEGIN
    -- Get the current authenticated user's ID
    requesting_user_id := auth.uid();

    -- Check if the requesting user is the owner of the space
    SELECT EXISTS (
        SELECT 1 
        FROM spaces 
        WHERE id = p_space_id 
        AND owner_id = requesting_user_id
    ) INTO is_space_owner;

    -- If not the space owner, return false
    IF NOT is_space_owner THEN
        RETURN false;
    END IF;

    -- Check if user email exists in auth.users and get their ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = p_user_email;

    -- If user not found, return false
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Make sure the user can't add themselves as members
    IF target_user_id = requesting_user_id THEN
        RETURN false;
    END IF;

    -- Check if the user is already a member of the space
    SELECT COUNT(*) INTO existing_member_count
    FROM space_members
    WHERE space_id = p_space_id 
      AND user_id = target_user_id;

    -- If already a member, update the role
    IF existing_member_count > 0 THEN
        UPDATE space_members
        SET role = p_member_role,
            modified_at = NOW()
        WHERE space_id = p_space_id 
          AND user_id = target_user_id;
        
        RETURN true;
    END IF;

    -- Insert the new space member
    INSERT INTO space_members (user_id, space_id, role)
    VALUES (target_user_id, p_space_id, p_member_role);

    RETURN true;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.add_space_member(text, uuid, text) TO authenticated;

-- Is the current user an owner or admin of a given space?
-- Includes the explicit owner_id on the spaces table.
CREATE OR REPLACE FUNCTION public.is_space_owner_or_admin(p_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM space_members sm
        WHERE sm.space_id = p_space_id
          AND sm.user_id = auth.uid()
          AND sm.role IN ('owner','admin')
        UNION
        SELECT 1
        FROM spaces s
        WHERE s.id = p_space_id
          AND s.owner_id = auth.uid()
    );
$$;

-- Can the current user view a space (any role, including owner)?
CREATE OR REPLACE FUNCTION public.is_space_viewer(p_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM space_members sm
        WHERE sm.space_id = p_space_id
          AND sm.user_id = auth.uid()
        UNION
        SELECT 1
        FROM spaces s
        WHERE s.id = p_space_id
          AND s.owner_id = auth.uid()
    );
$$;

-- Can the current user edit boxes in a space (owner, admin, or editor)?
CREATE OR REPLACE FUNCTION public.can_edit_boxes(p_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM space_members sm
        WHERE sm.space_id = p_space_id
          AND sm.user_id = auth.uid()
          AND sm.role IN ('owner','admin','editor')
        UNION
        SELECT 1
        FROM spaces s
        WHERE s.id = p_space_id
          AND s.owner_id = auth.uid()
    );
$$;


-- Owners / admins (and the explicit owner_id) have full CRUD on spaces
CREATE POLICY "owners_admins_full_access"
ON public.spaces
FOR ALL TO authenticated
USING (public.is_space_owner_or_admin(id))
WITH CHECK (public.is_space_owner_or_admin(id));

-- Viewers (any member) can only read
CREATE POLICY "viewers_can_select"
ON public.spaces
FOR SELECT TO authenticated
USING (public.is_space_viewer(id));

-- Owners / admins get full CRUD on boxes
CREATE POLICY "boxes_owner_admin_full"
ON public.boxes
FOR ALL TO authenticated
USING (public.is_space_owner_or_admin(space_id))
WITH CHECK (public.is_space_owner_or_admin(space_id));

-- Editors (owner, admin, editor) can INSERT
CREATE POLICY "boxes_editors_insert"
ON public.boxes
FOR INSERT TO authenticated
WITH CHECK (public.can_edit_boxes(space_id));

-- Editors can UPDATE
CREATE POLICY "boxes_editors_update"
ON public.boxes
FOR UPDATE TO authenticated
USING (public.can_edit_boxes(space_id))
WITH CHECK (public.can_edit_boxes(space_id));

-- Editors can DELETE
CREATE POLICY "boxes_editors_delete"
ON public.boxes
FOR DELETE TO authenticated
USING (public.can_edit_boxes(space_id));

-- Viewers (any member) can SELECT only
CREATE POLICY "boxes_viewers_select"
ON public.boxes
FOR SELECT TO authenticated
USING (public.is_space_viewer(space_id));


-- Only owners / admins of a space can manage its membership rows
CREATE POLICY "members_owner_admin_full"
ON public.space_members
FOR ALL TO authenticated
USING (public.is_space_owner_or_admin(space_id))
WITH CHECK (public.is_space_owner_or_admin(space_id));

-- Other users (members) of a space can read its membership rows
CREATE POLICY "members_others_select"
ON public.space_members
FOR ALL TO authenticated
USING (public.is_space_viewer(space_id))
WITH CHECK (public.is_space_viewer(space_id));

CREATE INDEX IF NOT EXISTS idx_space_members_user_space
    ON public.space_members(user_id, space_id, role);

CREATE INDEX IF NOT EXISTS idx_spaces_owner
    ON public.spaces(owner_id);

-- List space members
create or replace function public.get_space_members(p_space uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  role text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    sm.user_id,
    coalesce(
      (u.raw_user_meta_data->>'display_name'),
      split_part(u.email, '@', 1)
    ) as display_name,
    (u.raw_user_meta_data->>'avatar_url') as avatar_url,
    sm.role
  from public.space_members sm
  join auth.users u on u.id = sm.user_id
  where sm.space_id = p_space
    and (
      -- caller is a member
      exists (
        select 1 from public.space_members m
        where m.space_id = p_space and m.user_id = auth.uid()
      )
      -- or caller is owner
      or exists (
        select 1 from public.spaces s
        where s.id = p_space and s.owner_id = auth.uid()
      )
    );
$$;

grant execute on function public.get_space_members(uuid) to authenticated;
