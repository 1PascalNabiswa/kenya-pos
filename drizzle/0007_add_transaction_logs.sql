CREATE TABLE `transaction_logs` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `orderId` int NOT NULL,
  `customerId` int,
  `customerName` varchar(255) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cash` decimal(10,2) NOT NULL DEFAULT 0,
  `card` decimal(10,2) NOT NULL DEFAULT 0,
  `mpesa` decimal(10,2) NOT NULL DEFAULT 0,
  `wallet` decimal(10,2) NOT NULL DEFAULT 0,
  `check` decimal(10,2) NOT NULL DEFAULT 0,
  `totalAmount` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `transaction_logs_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `transaction_logs_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `transaction_logs_time_idx` ON `transaction_logs` (`time`);
CREATE INDEX `transaction_logs_customerName_idx` ON `transaction_logs` (`customerName`);
CREATE INDEX `transaction_logs_customerId_idx` ON `transaction_logs` (`customerId`);
