/*
  Warnings:

  - You are about to drop the column `userId` on the `ScrimApplication` table. All the data in the column will be lost.
  - You are about to drop the column `avgKda` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `avgTier` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `avgTierName` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `avgWinRate` on the `Team` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ScrimApplication" DROP CONSTRAINT "ScrimApplication_userId_fkey";

-- AlterTable
ALTER TABLE "ScrimApplication" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "avgKda",
DROP COLUMN "avgTier",
DROP COLUMN "avgTierName",
DROP COLUMN "avgWinRate",
ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 5;

-- AddForeignKey
ALTER TABLE "ScrimApplication" ADD CONSTRAINT "ScrimApplication_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
