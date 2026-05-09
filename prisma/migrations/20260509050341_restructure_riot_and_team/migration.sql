/*
  Warnings:

  - You are about to drop the column `currentTier` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `kda` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `riotGameName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `riotPuuid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `riotRegion` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `riotTagLine` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rr` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tierName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `winRate` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_riotPuuid_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentTier",
DROP COLUMN "kda",
DROP COLUMN "lastSyncedAt",
DROP COLUMN "riotGameName",
DROP COLUMN "riotPuuid",
DROP COLUMN "riotRegion",
DROP COLUMN "riotTagLine",
DROP COLUMN "rr",
DROP COLUMN "tierName",
DROP COLUMN "winRate";

-- CreateTable
CREATE TABLE "RiotAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "region" "RiotRegion" NOT NULL,
    "currentTier" INTEGER,
    "tierName" TEXT,
    "rr" INTEGER,
    "winRate" DOUBLE PRECISION,
    "kda" DOUBLE PRECISION,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiotAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiotAccount_userId_key" ON "RiotAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RiotAccount_puuid_key" ON "RiotAccount"("puuid");

-- AddForeignKey
ALTER TABLE "RiotAccount" ADD CONSTRAINT "RiotAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
