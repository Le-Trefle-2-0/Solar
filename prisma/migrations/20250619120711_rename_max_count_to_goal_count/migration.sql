/*
  Warnings:

  - You are about to drop the column `maxCount` on the `RoleSlot` table. All the data in the column will be lost.
  - Added the required column `goalCount` to the `RoleSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `RoleSlot` DROP COLUMN `maxCount`,
    ADD COLUMN `goalCount` INTEGER NOT NULL;
