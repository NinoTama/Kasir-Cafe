/*
  Warnings:

  - You are about to drop the column `aktif` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transactionitem` ADD COLUMN `catatan` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `aktif`;
