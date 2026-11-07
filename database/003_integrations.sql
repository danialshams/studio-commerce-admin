-- Daira CRM upgrade 003: secure notifications, provider-neutral messaging and signature envelopes.
-- Additive; safe on existing tenants. Legacy notifications stay private to administrators.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity varchar(40);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS notifications_scoped_idx ON notifications(org_id,entity,created_at DESC);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS delivery_consent boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS message_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 channel varchar(12) NOT NULL CHECK(channel IN ('email','sms')),
 recipient varchar(255) NOT NULL,
 subject varchar(200) NOT NULL DEFAULT '',
 body varchar(3000) NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','queued','processing','sent','failed','cancelled')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 20),
 next_attempt_at timestamptz, leased_at timestamptz,
 provider_id varchar(200), last_error varchar(350),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_ready_idx ON message_outbox(status,next_attempt_at,created_at);
CREATE INDEX IF NOT EXISTS outbox_org_idx ON message_outbox(org_id,created_at DESC);

CREATE TABLE IF NOT EXISTS signature_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 signer_name varchar(160) NOT NULL,
 signer_email varchar(255) NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'draft'
  CHECK(status IN ('draft','pending','signed','declined','expired','cancelled')),
 provider_request_id varchar(200),
 signing_url text,
 provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 signed_at timestamptz
);
CREATE INDEX IF NOT EXISTS signature_requests_org_idx ON signature_requests(org_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS signature_requests_provider_idx ON signature_requests(provider_request_id) WHERE provider_request_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS signature_webhook_events (
 event_id varchar(200) PRIMARY KEY,
 received_at timestamptz NOT NULL DEFAULT now()
);
