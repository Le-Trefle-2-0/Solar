-- CreateTable
CREATE TABLE `recruitment_waitlist`
(
    `id`            VARCHAR(191) NOT NULL,
    `email`         VARCHAR(191) NOT NULL,
    `recruitmentId` VARCHAR(191) NOT NULL,
    `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `recruitment_waitlist_email_recruitmentId_key`(`email`, `recruitmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recruitment_waitlist`
    ADD CONSTRAINT `recruitment_waitlist_recruitmentId_fkey` FOREIGN KEY (`recruitmentId`) REFERENCES `recruitment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
