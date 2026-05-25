-- Create user_branches table for user-to-branch assignment
CREATE TABLE IF NOT EXISTS `user_branches` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `branchId` int NOT NULL,
  `isPrimary` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_branch` (`userId`, `branchId`)
);

-- Create stock_transfers table for branch-to-branch transfers
CREATE TABLE IF NOT EXISTS `stock_transfers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `transferNumber` varchar(30) NOT NULL UNIQUE,
  `fromBranchId` int NOT NULL,
  `toBranchId` int NOT NULL,
  `status` enum('pending', 'in_transit', 'received', 'cancelled') NOT NULL DEFAULT 'pending',
  `initiatedBy` int NOT NULL,
  `approvedBy` int,
  `receivedBy` int,
  `notes` text,
  `initiatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approvedAt` timestamp,
  `receivedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`fromBranchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`toBranchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`initiatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`receivedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Create stock_transfer_items table for individual items in transfers
CREATE TABLE IF NOT EXISTS `stock_transfer_items` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `transferId` int NOT NULL,
  `productId` int NOT NULL,
  `productName` varchar(200) NOT NULL,
  `quantity` int NOT NULL,
  `receivedQuantity` int NOT NULL DEFAULT 0,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`transferId`) REFERENCES `stock_transfers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT
);

-- Add branch_id to orders table if not exists
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `branchId` int AFTER `id`;
ALTER TABLE `orders` ADD FOREIGN KEY IF NOT EXISTS (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL;

-- Add branch_id to inventory if it doesn't have it (assuming inventory_logs is the inventory table)
-- This is already in the schema, so we'll just ensure it's there

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS `idx_user_branches_userId` ON `user_branches`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_user_branches_branchId` ON `user_branches`(`branchId`);
CREATE INDEX IF NOT EXISTS `idx_stock_transfers_fromBranch` ON `stock_transfers`(`fromBranchId`);
CREATE INDEX IF NOT EXISTS `idx_stock_transfers_toBranch` ON `stock_transfers`(`toBranchId`);
CREATE INDEX IF NOT EXISTS `idx_stock_transfers_status` ON `stock_transfers`(`status`);
CREATE INDEX IF NOT EXISTS `idx_stock_transfer_items_transferId` ON `stock_transfer_items`(`transferId`);
CREATE INDEX IF NOT EXISTS `idx_orders_branchId` ON `orders`(`branchId`);
