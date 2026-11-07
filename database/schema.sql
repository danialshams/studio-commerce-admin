-- Portable PostgreSQL schema. Apply with psql before first startup.
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
  name varchar(120) NOT NULL, email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL, role varchar(30) NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
  name varchar(180) NOT NULL, company varchar(180) NOT NULL DEFAULT '',
  email varchar(255) NOT NULL DEFAULT '', phone varchar(40) NOT NULL DEFAULT '',
  status varchar(30) NOT NULL DEFAULT 'lead', source varchar(100) NOT NULL DEFAULT '',
  tags varchar(400) NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  title varchar(180) NOT NULL, amount bigint NOT NULL DEFAULT 0 CHECK(amount >= 0),
  stage varchar(40) NOT NULL DEFAULT 'new', probability integer NOT NULL DEFAULT 20 CHECK(probability BETWEEN 0 AND 100),
  expected_at date, notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  title varchar(200) NOT NULL, priority varchar(30) NOT NULL DEFAULT 'normal',
  status varchar(30) NOT NULL DEFAULT 'todo', due_at date, notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  number varchar(40) NOT NULL, kind varchar(30) NOT NULL DEFAULT 'quote',
  title varchar(200) NOT NULL, amount bigint NOT NULL DEFAULT 0 CHECK(amount >= 0),
  status varchar(30) NOT NULL DEFAULT 'draft', due_at date, notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,number)
);
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity varchar(40) NOT NULL, entity_id uuid, action varchar(40) NOT NULL,
  description varchar(500) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES organizations(id),
  title varchar(180) NOT NULL, body varchar(500) NOT NULL,
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, identifier varchar(300) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contacts_org_idx ON contacts(org_id,created_at DESC);
CREATE INDEX IF NOT EXISTS deals_org_idx ON deals(org_id,stage);
CREATE INDEX IF NOT EXISTS tasks_org_idx ON tasks(org_id,status,due_at);
CREATE INDEX IF NOT EXISTS documents_org_idx ON documents(org_id,created_at DESC);
CREATE INDEX IF NOT EXISTS activities_org_idx ON activities(org_id,created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_org_idx ON notifications(org_id,created_at DESC);
CREATE INDEX IF NOT EXISTS attempts_idx ON login_attempts(identifier,created_at DESC);
