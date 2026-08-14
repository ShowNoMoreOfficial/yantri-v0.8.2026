-- AlterTable
ALTER TABLE "Choice" ADD COLUMN     "lastMeasuredAt" TIMESTAMP(3),
ADD COLUMN     "measureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedUrl" TEXT;

-- CreateIndex
CREATE INDEX "Choice_publishedAt_idx" ON "Choice"("publishedAt");
