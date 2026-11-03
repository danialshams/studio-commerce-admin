-- Non-destructive alignment of order snapshots with the Prisma model.
-- Orders and demo products already stored in PostgreSQL are preserved.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantLabel" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB NOT NULL DEFAULT '{}';
