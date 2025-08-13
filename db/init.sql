-- Enable pgcrypto for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: spaces
CREATE TABLE spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now()
);

-- Table: boxes
CREATE TABLE boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  space_id uuid REFERENCES spaces(id) NOT NULL,
  location text,
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
  UNIQUE (space_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function
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
    EXISTS (
      SELECT 1
      FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = auth.uid()
    )
  );

-- Spaces: only owner can create
CREATE POLICY "Spaces: only owner can insert"
  ON spaces
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
  );

-- Spaces: only owner can delete
CREATE POLICY "Spaces: only owner can delete"
  ON spaces
  FOR DELETE
  USING (
    owner_id = auth.uid()
  );

-- Spaces: members can update
CREATE POLICY "Spaces: members can update"
  ON spaces
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = auth.uid()
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
        AND space_members.user_id = auth.uid()
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
        AND space_members.user_id = auth.uid()
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
        AND space_members.user_id = auth.uid()
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
        AND space_members.user_id = auth.uid()
    )
  );

-- Space members: allow all to read
CREATE POLICY "Space members: allow all to read"
  ON space_members
  FOR SELECT
  USING (true);

-- Space members: only owner can modify
CREATE POLICY "Space members: only owner can modify"
  ON space_members
  FOR ALL
  USING (is_space_owner(space_id, auth.uid()));
