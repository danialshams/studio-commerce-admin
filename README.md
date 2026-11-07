# Daira CRM — portable Next.js and PostgreSQL

Persian RTL, multi-tenant CRM, with Next.js 16, PostgreSQL and native Docker hosting. CRM is published from the **daira-crm** branch in the shared Git repository, **not** its unrelated `main` branch.

## Included features

- Organization-based signup/login, bcrypt password hashes, revocable HttpOnly sessions, login throttling, invitations (72-hour one-time URL), owner/admin/sales/support/viewer permissions.
- Contacts and leads, tagging, customer lifecycle, lead scoring field, activity logs, interactions, tasks/reminders, opportunities with pipeline and six-month metrics.
- Estimates/invoices, contracts, support tickets and replies, team permissions, CSV import/export, internal event rules, analytics and a mobile-first dashboard.
- Tenant and role-filtered notifications with 15-second UI polling. Old notifications without a typed module remain visible only to owner/admin.
- **Provider-ready customer communications:** explicit customer consent, draft messages, provider-enabled email/SMS sends, delivery history, locked queue and bounded retries.
- **Provider-ready digital signatures:** contract envelopes, external signing request, HMAC-authenticated webhook, replay protection and immutable activity record. No signed status is claimed by this integration before a verified provider event.
- Anonymous `GET /api/health` returns only `{ok: true|false}` after checking live database connectivity and required tables; it returns no credentials or customer data.

## Setup and database migrations

Node.js 22 and PostgreSQL 16+ are recommended. Copy `.env.example` to `.env.local` and configure **DATABASE_URL**, **SESSION_SECRET** and **CRON_SECRET** with unique values of at least 32 characters.

```sh
npm install
npm run migrate
npm run typecheck
npm run build
npm run start
```

`npm run migrate` applies `database/schema.sql` and `database/003_integrations.sql` under a PostgreSQL advisory transaction lock. All changes are additive and repeatable. Do **not** wipe an existing database to upgrade it. Back up before production migrations.

The Vercel project runs `npm run migrate && npm run build` from `vercel.json`, so schema changes must complete before the new deployment is published. A failed migration fails the deployment and retains the last known-good production deployment. GitHub Actions tests migration, TypeScript, build and disposable PostgreSQL HTTP integration flows.

For Docker, copy `.env.example` to `.env`, configure `POSTGRES_PASSWORD`, `SESSION_SECRET` and `CRON_SECRET`, then run `docker compose up --build -d`. Fresh database volumes initialize both SQL files. Existing Docker volumes need `docker compose exec db psql -v ON_ERROR_STOP=1 -U crm -d daira_crm -f /docker-entrypoint-initdb.d/02-integrations.sql` during a controlled upgrade.

## Optional paid providers — deliberately disabled by default

**Email**: Configure SMTP_HOST, SMTP_PORT (usually 465), SMTP_USER, SMTP_PASSWORD and SMTP_FROM. TLS is required. The draft/queue UI is available today; outgoing SMTP is unavailable until all settings are supplied.

**SMS**: Configure SMS_GATEWAY_URL (HTTPS only), SMS_GATEWAY_API_KEY and SMS_SENDER. The provider adapter POSTs JSON `{to,from,body,requestId}` with Bearer authorization and an Idempotency-Key header. If a provider uses a different API schema, implement its mapping inside `src/lib/providers.ts` before enabling credentials. No purchased SMS account is assumed.

**Digital signatures**: Configure SIGN_PROVIDER_URL (HTTPS), SIGN_PROVIDER_API_KEY, SIGN_WEBHOOK_SECRET (32+ random characters) and SIGN_CALLBACK_URL. The signing adapter POSTs `{requestId,signer,contract,callbackUrl}`. It requires a response `{providerRequestId,signingUrl}` where signingUrl is HTTPS. The provider must call POST `/api/webhooks/signature` with:
- `x-daira-timestamp`: 10-digit Unix time in seconds (within five minutes).
- `x-daira-signature`: `sha256=<HMAC_SHA256_HEX(secret, timestamp + "." + rawJsonBody)>`.
- JSON body: `{eventId,providerRequestId,status}` where status is signed, declined or expired.
- Event IDs must be globally unique to deduplicate callbacks.

The integration is a technical transport; legal recognition of digital signatures depends on the provider and jurisdiction. Until providers are configured, users can create drafts but no third-party messages or signing requests are dispatched. Sending requires an explicit user action and for SMS/email the recipient must have `delivery_consent=true`.

## Scheduled jobs and portability

`GET|POST /api/cron/reminders` produces idempotent reminders for tasks due today/overdue. `GET|POST /api/cron/deliveries` retries queued/failed provider messages (maximum 20 claims/run, maximum five attempts). Both require `Authorization: Bearer <CRON_SECRET>`. Vercel uses daily UTC cron jobs for Hobby compatibility; message queue actions also attempt immediate delivery. For more frequent retries on another host, schedule the same authenticated endpoint using system cron. No vendor-specific queue or Vercel database SDK is required.

**Migration to a private host**: Take a tested PostgreSQL backup with `pg_dump -Fc -f daira-crm.backup "$DATABASE_URL"`. On the new host, create a fresh Postgres database and run `pg_restore --no-owner --no-acl -d "$NEW_DATABASE_URL" daira-crm.backup`, then switch DATABASE_URL and deploy the same Next.js app. Rotate session/cron secrets appropriately, verify `/api/health`, move provider webhooks to the new domain and retest jobs. Use HTTPS and encrypted off-host backups. No data should be removed from the original instance until restoration is verified.

**Production checklist**: verify backup/restore, access permissions, rates, SSL, DNS, provider contracts and live customer-consent policies. Integration tests only run against disposable test databases; they must never create test customers in production.
