-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_channelId_fkey`;

-- AlterTable
ALTER TABLE `post` MODIFY `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'ALL', 'IDEA') NOT NULL,
    MODIFY `channelId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
