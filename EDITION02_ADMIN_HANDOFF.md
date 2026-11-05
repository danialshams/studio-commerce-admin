# Edition 02 — independent management application

This branch is the source for the **independent** repo `danialshams/essential-store-design-2-admin`.
It is deliberately **not** intended for merging into `studio-commerce-admin/main`,
which continues serving Edition 01.

## Verified implementation
- Editorial, minimalist responsive admin shell, order/customer/product management
- Visual, section-by-section homepage editor (9 areas), desktop/mobile previews
- Searchable internal destination picker using stable database IDs (products,
  categories, pages, articles), with external HTTPS and disabled link options
- Persistent media asset registry backed by S3 (uploads remain available
  even when the image is not used in a page)
- Draft versus published JSON content (no draft visible to the public storefront)
- Published data is exposed through the **existing read-only** store bootstrap
- Existing Next.js commerce admin session authentication is retained in real mode

## Safe production isolation
1. Create a **new repository** `essential-store-design-2-admin`. Move this branch
   into the new repo as its `main`. Do NOT merge this source into Edition 01 admin.
2. Create a **new Neon PostgreSQL database** for Edition 02. Do not reuse the
   Edition 01 admin DATABASE_URL; the old code was single-store based.
3. Run `npm install`, `npx prisma migrate deploy`, `npx prisma generate`,
   `npm test`, `npm run typecheck` and `npm run build` against the isolated DB.
4. Create an admin account with `scripts/setup-admin.mjs`, using the documented
   environment setup. Store credentials as server secrets, never in git.
5. Configure an **independent** S3 bucket or isolated prefix, including
   `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
   `S3_SECRET_ACCESS_KEY` and `S3_PUBLIC_URL`.
6. Deploy the new repo to its own Vercel project and configure server-only
   `STORE_API_SECRET` (>=32 characters, unique to Edition 02) and
   `DATABASE_URL`. Remove `NEXT_PUBLIC_STUDIO_DEMO` entirely in production.
7. Configure Edition 02 storefront `STOREFRONT_ADMIN_ORIGIN` to use this
   independently deployed admin and `STOREFRONT_API_SECRET` to the matching
   server-only `STORE_API_SECRET`. The storefront branch
   `feature/edition-02-cms-connection` has passed CI and browser QA.
8. After checking product/catalog sync, live orders and publishing across
   mobile/desktop, merge the storefront PR to `main`.

## Demo-only Vercel project
A separate Vercel project `essential-store-design-2-admin` may run with
`NEXT_PUBLIC_STUDIO_DEMO=1`. All UI edits happen in memory and do not affect
live customer data. It is **not** a production admin or a live store backend.
Do not reuse the demo deployment as an order backend.

## Known operational prerequisites
- Real payment initiation/webhook settlement must be configured separately.
- Customer account authentication and live order history are a separate scope.
- An image requires S3 configured in real mode. No unsafe filesystem uploads.
- The CMS does not expose GSAP animation settings to merchants.
