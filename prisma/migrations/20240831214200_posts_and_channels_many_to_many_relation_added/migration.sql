/*
  Warnings:

  - You are about to drop the column `channelId` on the `post` table. All the data in the column will be lost.
  - You are about to drop the column `media` on the `post` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,userId,workSpaceId]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_channelId_fkey`;

-- AlterTable
ALTER TABLE `post` DROP COLUMN `channelId`,
    DROP COLUMN `media`;

-- CreateTable
CREATE TABLE `PostChannel` (
    `postId` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`postId`, `channelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Channel_name_userId_workSpaceId_key` ON `Channel`(`name`, `userId`, `workSpaceId`);

-- AddForeignKey
ALTER TABLE `PostChannel` ADD CONSTRAINT `PostChannel_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostChannel` ADD CONSTRAINT `PostChannel_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
