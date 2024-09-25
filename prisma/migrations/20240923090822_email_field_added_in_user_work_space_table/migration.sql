/*
  Warnings:

  - A unique constraint covering the columns `[userId,workSpaceId,email]` on the table `UserWorkSpace` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `UserWorkSpace_userId_workSpaceId_key` ON `userworkspace`;

-- AlterTable
ALTER TABLE `userworkspace` ADD COLUMN `email` VARCHAR(191) NULL,
    MODIFY `userId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `UserWorkSpace_email_idx` ON `UserWorkSpace`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `UserWorkSpace_userId_workSpaceId_email_key` ON `UserWorkSpace`(`userId`, `workSpaceId`, `email`);
