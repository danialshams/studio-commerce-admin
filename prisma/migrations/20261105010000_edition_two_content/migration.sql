ALTER TABLE "StoreSettings"
 ADD COLUMN IF NOT EXISTS "editorialConfig" JSONB,
 ADD COLUMN IF NOT EXISTS "editorialDraft" JSONB;

ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "target" JSONB;

CREATE TABLE IF NOT EXISTS "MediaAsset" (
 "id" TEXT NOT NULL,
 "url" TEXT NOT NULL,
 "storageKey" TEXT NOT NULL,
 "mimeType" TEXT NOT NULL,
 "originalName" TEXT NOT NULL,
 "size" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_url_key" ON "MediaAsset"("url");
CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX IF NOT EXISTS "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");
