/*
  Warnings:

  - You are about to drop the column `awayScore` on the `MatchResult` table. All the data in the column will be lost.
  - You are about to drop the column `homeScore` on the `MatchResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MatchResult" DROP COLUMN "awayScore",
DROP COLUMN "homeScore",
ADD COLUMN     "awaySetsWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "homeSetsWon" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MatchSet" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchSet_resultId_setNumber_key" ON "MatchSet"("resultId", "setNumber");

-- AddForeignKey
ALTER TABLE "MatchSet" ADD CONSTRAINT "MatchSet_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "MatchResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
