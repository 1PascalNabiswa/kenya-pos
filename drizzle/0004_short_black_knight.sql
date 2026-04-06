CREATE TABLE `kds_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int,
	`soundAlertEnabled` boolean NOT NULL DEFAULT true,
	`visualAlertEnabled` boolean NOT NULL DEFAULT true,
	`autoMarkReady` boolean NOT NULL DEFAULT false,
	`readyDisplayTime` int NOT NULL DEFAULT 300,
	`theme` varchar(20) DEFAULT 'dark',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kds_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`station` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`ordersCompleted` int NOT NULL DEFAULT 0,
	`averagePrepTime` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kitchen_staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('pending','preparing','ready','served','completed') NOT NULL,
	`kitchenStaffId` int,
	`notes` text,
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `kds_settings` ADD CONSTRAINT `kds_settings_branchId_branches_id_fk` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kitchen_staff` ADD CONSTRAINT `kitchen_staff_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_kitchenStaffId_kitchen_staff_id_fk` FOREIGN KEY (`kitchenStaffId`) REFERENCES `kitchen_staff`(`id`) ON DELETE no action ON UPDATE no action;