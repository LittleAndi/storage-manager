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

-- Enable RLS on all tables
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function
create or replace function get_spaces_for_user(user_id uuid)
returns setof uuid as $$
  select id from spaces where owner_id = $1
$$ stable language sql security definer;

create policy "Space owners can do whatever to boxes"
on boxes
for all using (
  space_id in (select get_spaces_for_user(auth.uid()))
);

CREATE OR REPLACE FUNCTION is_space_owner(space_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM spaces
    WHERE id = space_id
      AND owner_id = user_id
  );
$$;

-- Spaces: owners and members can read
CREATE POLICY "Spaces: owners and members can read"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1
      FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = (select auth.uid())
    )
  );

-- Spaces: only owner can create
CREATE POLICY "Spaces: only owner can insert"
  ON spaces
  FOR INSERT
  WITH CHECK (
    owner_id = (select auth.uid())
  );

-- Spaces: only owner can delete
CREATE POLICY "Spaces: only owner can delete"
  ON spaces
  FOR DELETE
  USING (
    owner_id = (select auth.uid())
  );

-- Spaces: members can update
CREATE POLICY "Spaces: members can update"
  ON spaces
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = (select auth.uid())
    )
  );

-- Boxes: members can read
CREATE POLICY "Boxes: members can read"
  ON boxes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = boxes.space_id
        AND space_members.user_id = (select auth.uid())
    )
  );

-- Boxes: members can modify
CREATE POLICY "Boxes: members can modify"
  ON boxes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = boxes.space_id
        AND space_members.user_id = (select auth.uid())
    )
  );

-- Items: members can read
CREATE POLICY "Items: members can read"
  ON items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boxes
      JOIN space_members ON boxes.space_id = space_members.space_id
      WHERE boxes.id = items.box_id
        AND space_members.user_id = (select auth.uid())
    )
  );

-- Items: members can modify
CREATE POLICY "Items: members can modify"
  ON items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boxes
      JOIN space_members ON boxes.space_id = space_members.space_id
      WHERE boxes.id = items.box_id
        AND space_members.user_id = (select auth.uid())
    )
  );

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
            updated_at = NOW()
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

-- Policy on space_members
create policy "Owners can modify members"
on "public"."space_members"
to public
using (
  (( SELECT auth.uid() AS uid) IN ( SELECT spaces.owner_id
   FROM spaces
  WHERE (space_members.space_id = spaces.id)))
);


-- For later
-- Space Member Roles: 'owner', 'admin', 'editor', 'viewer'

-- RLS for Spaces
CREATE OR REPLACE FUNCTION is_space_member(check_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM space_members 
        WHERE space_id = check_space_id 
        AND user_id = auth.uid()
        AND role != 'viewer'
    );
$$;

-- Spaces: Owner and Admin Full Access
CREATE POLICY "Owners and Admins can manage spaces" ON spaces
FOR ALL TO authenticated
USING (
    id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    ) OR owner_id = auth.uid()
)
WITH CHECK (
    is_space_member(id) OR owner_id = auth.uid()
);

-- Spaces: Viewers can view
CREATE POLICY "Viewers can view space details" ON spaces
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid()
    )
);

-- Boxes: Owner and Admin Full Access
CREATE POLICY "Owners and Admins can manage boxes" ON boxes
FOR ALL TO authenticated
USING (
    space_id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    ) OR space_id IN (
        SELECT id 
        FROM spaces 
        WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    space_id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'editor')
    ) OR space_id IN (
        SELECT id 
        FROM spaces 
        WHERE owner_id = auth.uid()
    )
);

-- Boxes: Editors can add/modify boxes
CREATE POLICY "Editors can modify boxes in their spaces" ON boxes
FOR INSERT TO authenticated
WITH CHECK (
    space_id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'editor')
    )
);

-- Boxes: Viewers can view
CREATE POLICY "Viewers can view boxes" ON boxes
FOR SELECT TO authenticated
USING (
    space_id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid()
    )
);

-- Space Members: Owner/Admin can manage membership
CREATE POLICY "Owners and Admins can manage space members" ON space_members
FOR ALL TO authenticated
USING (
    space_id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
)
WITH CHECK (
    space_id IN (
        SELECT space_id 
        FROM space_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- Index for performance
CREATE INDEX idx_space_members_user_space ON space_members(user_id, space_id, role);
CREATE INDEX idx_spaces_owner ON spaces(owner_id);
