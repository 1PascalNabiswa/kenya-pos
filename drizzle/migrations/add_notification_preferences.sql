-- Add notification preferences table
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `notificationType` enum('low_stock_alert','large_transaction','new_form_creation','new_user_login','payment_failure','daily_summary') NOT NULL,
  `enabled` boolean NOT NULL DEFAULT true,
  `frequency` enum('instant','daily','weekly') NOT NULL DEFAULT 'instant',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_notification_type` (`userId`, `notificationType`)
);
