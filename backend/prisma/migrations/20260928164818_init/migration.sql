-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('oem', 'supplier', 'factory', 'service', 'arbiter');

-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('active', 'failed', 'retired');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('invoice', 'warranty', 'service_report', 'purchase_order', 'inspection', 'label_photo');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('register', 'transfer', 'install', 'service', 'claim', 'resolve', 'flag_suspect');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('open', 'accepted', 'rejected', 'disputed');

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "manufacturerOrgId" TEXT NOT NULL,
    "currentOwnerOrgId" TEXT NOT NULL,
    "installedMachine" TEXT,
    "status" "PartStatus" NOT NULL DEFAULT 'active',
    "warrantyUntil" TIMESTAMP(3),
    "chainTxHash" TEXT,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploadedByOrgId" TEXT NOT NULL,
    "extracted" JSONB,
    "extractionModel" TEXT,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "actorOrgId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "docHash" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'open',
    "failureDescription" TEXT NOT NULL,
    "ruleResults" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "decidedByOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Org_walletAddress_key" ON "Org"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Part_partId_key" ON "Part"("partId");

-- CreateIndex
CREATE INDEX "Part_partId_idx" ON "Part"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_txHash_key" ON "Event"("txHash");

-- CreateIndex
CREATE INDEX "Event_partId_idx" ON "Event"("partId");

-- CreateIndex
CREATE INDEX "Event_txHash_idx" ON "Event"("txHash");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_manufacturerOrgId_fkey" FOREIGN KEY ("manufacturerOrgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_currentOwnerOrgId_fkey" FOREIGN KEY ("currentOwnerOrgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByOrgId_fkey" FOREIGN KEY ("uploadedByOrgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_actorOrgId_fkey" FOREIGN KEY ("actorOrgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_decidedByOrgId_fkey" FOREIGN KEY ("decidedByOrgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
