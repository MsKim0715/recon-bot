/*
  Warnings:

  - A unique constraint covering the columns `[number,guildId]` on the table `Scrim` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guildId` to the `Scrim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Scrim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scrim" ADD COLUMN     "guildId" TEXT NOT NULL,
ADD COLUMN     "number" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Scrim_number_guildId_key" ON "Scrim"("number", "guildId");
