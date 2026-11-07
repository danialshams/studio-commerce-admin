# Daira CRM — portable Next.js / PostgreSQL CRM

Responsive Persian CRM for sales pipeline, contacts, tasks, quotations/invoices, audit activities and real-time-ish notification polling. Data is stored in PostgreSQL with tenant-scoped queries and server-only credentials. This is an initial working release, **not** yet a full enterprise CRM: email/SMS integration, digital signing, employee invitations, AI scoring and advanced workflow rules are planned.

## Local setup
1. Node.js 22 and PostgreSQL 16+.
2. `cp .env.example .env.local`, set a real `DATABASE_URL` and generate `SESSION_SECRET` using `openssl rand -hex 32`.
3. Run `psql "$DATABASE_URL" -f database/schema.sql` once (this script is additive/idempotent).
4. Run `npm install && npm run dev`.
5. Open http://localhost:3000; use **Create account** to start an independent workspace.

## Production
- Set DATABASE_URL and SESSION_SECRET as secret environment variables (not in Git).
- Apply schema.sql before deploying; deploy `main` on Vercel or `docker compose up --build -d` on your own VPS.
- For Docker copy `.env.example` to `.env`, set `POSTGRES_PASSWORD` and `SESSION_SECRET`; local database will be initialized by volume mount. Use a reverse proxy with HTTPS in production.
- Export PostgreSQL data via `pg_dump` and restore with `pg_restore` to migrate off managed hosting; switch DATABASE_URL, move file storage if added, re-point DNS. No Vercel-specific SDK is required.
- Backups, monitoring, SMTP, SMS, external billing and tenant user invitations must be configured before commercial production use.

## Current modules
- Workspace sign-up and sign-in (bcrypt hashing, signed HttpOnly session, login attempt cap)
- Contacts/leads, deals/pipeline, tasks, quotes/invoices: scoped CRUD
- Audit activity history and notification list (polled every 15s)
- Dashboard and reports, configurable workspace, CSV export, RTL responsive UI
