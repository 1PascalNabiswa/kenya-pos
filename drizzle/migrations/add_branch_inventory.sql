-- Maintain stock independently for each branch while preserving the existing product catalog.
CREATE TABLE IF NOT EXISTS `branch_inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branchId` int NOT NULL,
  `productId` int NOT NULL,
  `stockQuantity` int NOT NULL DEFAULT 0,
  `lowStockThreshold` int NOT NULL DEFAULT 10,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_inventory_branch_product_unique` (`branchId`, `productId`),
  KEY `branch_inventory_branch_fk` (`branchId`),
  KEY `branch_inventory_product_fk` (`productId`),
  CONSTRAINT `branch_inventory_branch_fk` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`),
  CONSTRAINT `branch_inventory_product_fk` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
);

INSERT INTO `branch_inventory` (`branchId`, `productId`, `stockQuantity`, `lowStockThreshold`)
SELECT b.`id`, p.`id`, p.`stockQuantity`, p.`lowStockThreshold`
FROM `branches` b
CROSS JOIN `products` p
LEFT JOIN `branch_inventory` bi
  ON bi.`branchId` = b.`id` AND bi.`productId` = p.`id`
WHERE bi.`id` IS NULL;
