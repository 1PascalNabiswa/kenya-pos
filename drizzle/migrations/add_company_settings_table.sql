CREATE TABLE `company_settings` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `companyName` varchar(255) NOT NULL,
  `logo` text,
  `address` text,
  `phone` varchar(20),
  `email` varchar(320),
  `website` varchar(255),
  `taxId` varchar(50),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
