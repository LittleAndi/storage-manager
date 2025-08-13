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

-- Spaces: owner or shared member can SELECT
CREATE POLICY "Spaces: owner or shared member"
  ON spaces
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = auth.uid()
    )
  );

-- Spaces: owner or shared member can INSERT, UPDATE, DELETE
CREATE POLICY "Spaces: owner or shared member can modify"
  ON spaces
  FOR ALL USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = auth.uid()
    )
  );

-- Boxes: user can access if they have access to the parent space
CREATE POLICY "Boxes: user can access if space is accessible"
  ON boxes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = boxes.space_id
        AND (
          spaces.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM space_members
            WHERE space_members.space_id = boxes.space_id
              AND space_members.user_id = auth.uid()
          )
        )
    )
  );

-- Boxes: owner or shared member can INSERT, UPDATE, DELETE
CREATE POLICY "Boxes: owner or shared member can modify"
  ON boxes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = boxes.space_id
        AND (
          spaces.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM space_members
            WHERE space_members.space_id = boxes.space_id
              AND space_members.user_id = auth.uid()
          )
        )
    )
  );

-- Items: user can access if they have access to the parent box's space
CREATE POLICY "Items: user can access if space is accessible"
  ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boxes
      JOIN spaces ON boxes.space_id = spaces.id
      WHERE boxes.id = items.box_id
        AND (
          spaces.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM space_members
            WHERE space_members.space_id = boxes.space_id
              AND space_members.user_id = auth.uid()
          )
        )
    )
  );

-- Items: owner or shared member can INSERT, UPDATE, DELETE
CREATE POLICY "Items: owner or shared member can modify"
  ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM boxes
      JOIN spaces ON boxes.space_id = spaces.id
      WHERE boxes.id = items.box_id
        AND (
          spaces.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM space_members
            WHERE space_members.space_id = boxes.space_id
              AND space_members.user_id = auth.uid()
          )
        )
    )
  );

-- Space_members: only space owner or shared member can INSERT/DELETE, user can SELECT their own memberships
CREATE POLICY "Space_members: owner or shared member can modify"
  ON space_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND (
          spaces.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM space_members sm2
            WHERE sm2.space_id = spaces.id
              AND sm2.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Space_members: user can view their memberships"
  ON space_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_members.space_id
        AND (
          spaces.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM space_members sm2
            WHERE sm2.space_id = spaces.id
              AND sm2.user_id = auth.uid()
          )
        )
    )
  );