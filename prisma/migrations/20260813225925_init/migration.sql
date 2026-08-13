-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceSlug" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "brandContext" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Choice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "source" TEXT,
    "platform" TEXT,
    "scores" JSONB NOT NULL DEFAULT '{}',
    "reasoning" JSONB NOT NULL DEFAULT '{}',
    "verdict" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "killed" BOOLEAN NOT NULL DEFAULT false,
    "killReason" TEXT,
    "runId" TEXT,
    "daftarEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "outlierMultiple" DOUBLE PRECISION,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_workspaceSlug_key" ON "Tenant"("workspaceSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_apiKeyHash_key" ON "Tenant"("apiKeyHash");

-- CreateIndex
CREATE INDEX "Choice_tenantId_createdAt_idx" ON "Choice"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Choice_runId_idx" ON "Choice"("runId");

-- CreateIndex
CREATE INDEX "Outcome_choiceId_idx" ON "Outcome"("choiceId");

-- AddForeignKey
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "Choice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
