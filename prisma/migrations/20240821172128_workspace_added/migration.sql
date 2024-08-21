-- CreateTable
CREATE TABLE `WorkSpace` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `timeZone` VARCHAR(191) NOT NULL,
    `timeZoneOffset` VARCHAR(191) NULL,
    `startDay` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserWorkSpace` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `workSpaceId` VARCHAR(191) NOT NULL,
    `role` ENUM('CREATOR', 'ADMIN', 'MEMBER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserWorkSpace_userId_idx`(`userId`),
    INDEX `UserWorkSpace_workSpaceId_idx`(`workSpaceId`),
    UNIQUE INDEX `UserWorkSpace_userId_workSpaceId_key`(`userId`, `workSpaceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserWorkSpace` ADD CONSTRAINT `UserWorkSpace_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWorkSpace` ADD CONSTRAINT `UserWorkSpace_workSpaceId_fkey` FOREIGN KEY (`workSpaceId`) REFERENCES `WorkSpace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
