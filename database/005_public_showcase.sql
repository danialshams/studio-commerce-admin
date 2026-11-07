-- Public showcase is a dedicated fictional workspace, never a real tenant.
-- The build-time seeder uses this one marker to keep its sample data repeatable.
CREATE TABLE IF NOT EXISTS public_demo_versions (
 org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
 version integer NOT NULL,
 seeded_at timestamptz NOT NULL DEFAULT now()
);
