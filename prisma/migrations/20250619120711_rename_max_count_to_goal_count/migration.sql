/*
  Warnings:

  - You are about to drop the column `maxCount` on the `role_slot` table. All the data in the column will be lost.
  - Added the required column `goalCount` to the `role_slot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `role_slot` DROP COLUMN `maxCount`,
    ADD COLUMN `goalCount` INTEGER NOT NULL;
