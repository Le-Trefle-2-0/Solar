-- When the user saw the welcome tour shown at first sign-in (#82)
ALTER TABLE `user` ADD COLUMN `onboardedAt` DATETIME(3) NULL;
