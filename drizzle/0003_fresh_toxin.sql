CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(50) NOT NULL,
	`module` varchar(50) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`beforeValue` json,
	`afterValue` json,
	`deviceId` varchar(100),
	`ipAddress` varchar(50),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`location` varchar(300),
	`phone` varchar(20),
	`manager` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int,
	`studentName` varchar(200) NOT NULL,
	`studentId` varchar(100),
	`balance` decimal(12,2) DEFAULT '0',
	`totalCredit` decimal(12,2) DEFAULT '0',
	`totalPaid` decimal(12,2) DEFAULT '0',
	`status` enum('active','settled','suspended') NOT NULL DEFAULT 'active',
	`authorizedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creditAccountId` int,
	`orderId` int,
	`amount` decimal(12,2) NOT NULL,
	`type` enum('credit','payment','adjustment') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`code` varchar(50) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`spent` decimal(12,2) DEFAULT '0',
	`servingPointId` int,
	`status` enum('not_issued','issued_not_approved','issued_approved','submitted_for_payment','pending_payment','paid') NOT NULL DEFAULT 'not_issued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `forms_title_unique` UNIQUE(`title`),
	CONSTRAINT `forms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `serving_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int,
	`name` varchar(200) NOT NULL,
	`description` text,
	`location` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serving_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`phone` varchar(20),
	`email` varchar(100),
	`address` text,
	`paymentStatus` enum('paid','unpaid','partial') NOT NULL DEFAULT 'unpaid',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`role` enum('admin','owner','manager','supervisor','cashier','waiter','store_manager') NOT NULL,
	`branchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD CONSTRAINT `credit_accounts_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD CONSTRAINT `credit_accounts_authorizedBy_users_id_fk` FOREIGN KEY (`authorizedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_creditAccountId_credit_accounts_id_fk` FOREIGN KEY (`creditAccountId`) REFERENCES `credit_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms` ADD CONSTRAINT `forms_servingPointId_serving_points_id_fk` FOREIGN KEY (`servingPointId`) REFERENCES `serving_points`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serving_points` ADD CONSTRAINT `serving_points_branchId_branches_id_fk` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_branchId_branches_id_fk` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE no action ON UPDATE no action;