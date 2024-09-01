-- DropForeignKey
ALTER TABLE `channel` DROP FOREIGN KEY `Channel_userId_fkey`;

-- DropForeignKey
ALTER TABLE `channel` DROP FOREIGN KEY `Channel_workSpaceId_fkey`;

-- DropForeignKey
ALTER TABLE `otp` DROP FOREIGN KEY `Otp_userId_fkey`;

-- DropForeignKey
ALTER TABLE `passwordresettoken` DROP FOREIGN KEY `PasswordResetToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_userId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_workSpaceId_fkey`;

-- DropForeignKey
ALTER TABLE `postchannel` DROP FOREIGN KEY `PostChannel_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `postchannel` DROP FOREIGN KEY `PostChannel_postId_fkey`;

-- DropForeignKey
ALTER TABLE `userworkspace` DROP FOREIGN KEY `UserWorkSpace_userId_fkey`;

-- DropForeignKey
ALTER TABLE `userworkspace` DROP FOREIGN KEY `UserWorkSpace_workSpaceId_fkey`;

-- AddForeignKey
ALTER TABLE `UserWorkSpace` ADD CONSTRAINT `UserWorkSpace_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWorkSpace` ADD CONSTRAINT `UserWorkSpace_workSpaceId_fkey` FOREIGN KEY (`workSpaceId`) REFERENCES `WorkSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Otp` ADD CONSTRAINT `Otp_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_workSpaceId_fkey` FOREIGN KEY (`workSpaceId`) REFERENCES `WorkSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_workSpaceId_fkey` FOREIGN KEY (`workSpaceId`) REFERENCES `WorkSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostChannel` ADD CONSTRAINT `PostChannel_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostChannel` ADD CONSTRAINT `PostChannel_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
