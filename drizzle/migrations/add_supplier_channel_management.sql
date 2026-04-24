-- Create supplier_deliveries table
CREATE TABLE IF NOT EXISTS `supplier_deliveries` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `supplierId` int NOT NULL,
  `deliveryDate` timestamp NOT NULL,
  `referenceNumber` varchar(100),
  `totalQuantity` int NOT NULL,
  `totalAmount` decimal(14, 2),
  `status` enum('pending', 'received', 'partial', 'cancelled') NOT NULL DEFAULT 'pending',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`)
);

-- Create delivery_items table
CREATE TABLE IF NOT EXISTS `delivery_items` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `deliveryId` int NOT NULL,
  `productId` int NOT NULL,
  `quantityOrdered` int NOT NULL,
  `quantityReceived` int NOT NULL DEFAULT 0,
  `unitPrice` decimal(12, 2) NOT NULL,
  `totalPrice` decimal(14, 2) NOT NULL,
  `expiryDate` timestamp,
  `batchNumber` varchar(100),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`deliveryId`) REFERENCES `supplier_deliveries`(`id`),
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`)
);

-- Create store_inventory table
CREATE TABLE IF NOT EXISTS `store_inventory` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `productId` int NOT NULL,
  `storeQuantity` int NOT NULL DEFAULT 0,
  `sellingPointQuantity` int NOT NULL DEFAULT 0,
  `lastRestockDate` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `productId` (`productId`),
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`)
);

-- Create store_transfers table
CREATE TABLE IF NOT EXISTS `store_transfers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `productId` int NOT NULL,
  `quantity` int NOT NULL,
  `transferType` enum('store_to_selling_point', 'selling_point_to_store', 'adjustment') NOT NULL,
  `transferDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` varchar(200),
  `notes` text,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`),
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`)
);
