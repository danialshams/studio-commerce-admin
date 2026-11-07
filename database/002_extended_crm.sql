-- Repeatable CRM extension. Run once on existing databases before deploying the extended app.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_rev integer NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES users(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 email varchar(255) NOT NULL, role varchar(30) NOT NULL DEFAULT 'sales',
 token_hash varchar(64) NOT NULL UNIQUE, created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 expires_at timestamptz NOT NULL, accepted_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invitations_org_idx ON invitations(org_id,created_at DESC);
CREATE TABLE IF NOT EXISTS contracts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
 contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL, deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
 number varchar(50) NOT NULL, title varchar(200) NOT NULL,
 amount bigint NOT NULL DEFAULT 0 CHECK(amount >= 0), status varchar(30) NOT NULL DEFAULT 'draft',
 start_at date, end_at date, terms text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(org_id,number)
);
CREATE INDEX IF NOT EXISTS contracts_org_idx ON contracts(org_id,created_at DESC);
CREATE TABLE IF NOT EXISTS tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
 contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL, assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
 title varchar(200) NOT NULL, description text NOT NULL DEFAULT '',
 priority varchar(30) NOT NULL DEFAULT 'normal', status varchar(30) NOT NULL DEFAULT 'open',
 due_at date, closed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_org_idx ON tickets(org_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS ticket_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
 ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 author_id uuid REFERENCES users(id) ON DELETE SET NULL,
 body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_comments_idx ON ticket_comments(org_id,ticket_id,created_at);
CREATE TABLE IF NOT EXISTS automation_rules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
 title varchar(180) NOT NULL, event varchar(50) NOT NULL, action varchar(50) NOT NULL,
 payload varchar(500) NOT NULL DEFAULT '', enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS automation_rules_org_idx ON automation_rules(org_id,enabled,event);
CREATE TABLE IF NOT EXISTS notification_reads (
 notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 PRIMARY KEY(notification_id,user_id)
);
CREATE INDEX IF NOT EXISTS activities_entity_idx ON activities(org_id,entity,entity_id,created_at DESC);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS won_at timestamptz;
UPDATE deals SET won_at=created_at WHERE stage='won' AND won_at IS NULL;
CREATE TABLE IF NOT EXISTS reminder_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
 entity_id uuid NOT NULL, kind varchar(32) NOT NULL, run_date date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(org_id,entity_id,kind,run_date)
);
