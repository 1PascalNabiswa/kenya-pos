-- Add missing columns to suppliers table
ALTER TABLE `suppliers` 
ADD COLUMN `phone` varchar(20) AFTER `phoneNumber`,
ADD COLUMN `country` varchar(100) AFTER `city`,
ADD COLUMN `notes` text AFTER `paymentTerms`,
ADD COLUMN `isActive` boolean NOT NULL DEFAULT true AFTER `notes`;
