/*
  Warnings:

  - Added the required column `mediaUrl` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `post` ADD COLUMN `mediaUrl` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_workSpaceId_fkey` FOREIGN KEY (`workSpaceId`) REFERENCES `WorkSpace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_workSpaceId_fkey` FOREIGN KEY (`workSpaceId`) REFERENCES `WorkSpace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
