/*
  Warnings:

  - A unique constraint covering the columns `[name,guildId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guildId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "guildId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_guildId_key" ON "Team"("name", "guildId");
