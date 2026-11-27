-- Who uploaded each file, so the web app can restrict access to it (#211)
ALTER TABLE `file` ADD COLUMN `uploadedById` VARCHAR(191) NULL;

CREATE INDEX `file_uploadedById_idx` ON `file`(`uploadedById`);
