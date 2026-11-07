-- One-time, per-workspace, non-destructive demo dataset tracker.
-- All example records are created only after explicit opt-in.
CREATE TABLE IF NOT EXISTS demo_seed_runs (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  seeded_at timestamptz NOT NULL DEFAULT now()
);
