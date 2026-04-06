-- Add wallet to paymentMethod enum in orders table
ALTER TABLE `orders` MODIFY COLUMN `paymentMethod` ENUM('cash', 'mpesa', 'stripe', 'mixed', 'wallet') NOT NULL;
