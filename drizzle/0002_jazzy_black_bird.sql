CREATE TABLE `customer_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`balance` decimal(14,2) NOT NULL DEFAULT '0',
	`totalLoaded` decimal(14,2) NOT NULL DEFAULT '0',
	`totalSpent` decimal(14,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`method` enum('cash','mpesa','stripe','wallet') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`transactionId` varchar(100),
	`reference` varchar(100),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_reconciliation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` varchar(100) NOT NULL,
	`method` enum('mpesa','stripe','bank') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`customerName` varchar(200),
	`customerId` int,
	`orderId` int,
	`status` enum('unused','used','disputed') NOT NULL DEFAULT 'unused',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`matchedAt` timestamp,
	CONSTRAINT `transaction_reconciliation_id` PRIMARY KEY(`id`),
	CONSTRAINT `transaction_reconciliation_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletId` int NOT NULL,
	`customerId` int NOT NULL,
	`type` enum('load','spend','refund') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`orderId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customer_wallets` ADD CONSTRAINT `customer_wallets_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_reconciliation` ADD CONSTRAINT `transaction_reconciliation_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_reconciliation` ADD CONSTRAINT `transaction_reconciliation_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_walletId_customer_wallets_id_fk` FOREIGN KEY (`walletId`) REFERENCES `customer_wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;