-- ─── Employment Types ──────────────────────────────────────────────────────
CREATE TABLE `employment_types` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Staff Employment Records ──────────────────────────────────────────────
CREATE TABLE `staff_employment` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `staffProfileId` int NOT NULL,
  `employmentTypeId` int NOT NULL,
  `baseSalary` decimal(12,2) NOT NULL DEFAULT '0',
  `hourlyRate` decimal(12,2) NOT NULL DEFAULT '0',
  `dailyRate` decimal(12,2) NOT NULL DEFAULT '0',
  `bankAccount` varchar(50),
  `bankName` varchar(100),
  `nssf` varchar(20),
  `nhif` varchar(20),
  `kra` varchar(20),
  `startDate` timestamp NOT NULL,
  `endDate` timestamp,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles` (`id`),
  FOREIGN KEY (`employmentTypeId`) REFERENCES `employment_types` (`id`)
) ENGINE=InnoDB;

-- ─── Deduction Types ───────────────────────────────────────────────────────
CREATE TABLE `deduction_types` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `description` text,
  `isStatutory` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Payroll Deductions ────────────────────────────────────────────────────
CREATE TABLE `payroll_deductions` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `staffEmploymentId` int NOT NULL,
  `deductionTypeId` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `percentage` decimal(5,2),
  `startDate` timestamp NOT NULL,
  `endDate` timestamp,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`staffEmploymentId`) REFERENCES `staff_employment` (`id`),
  FOREIGN KEY (`deductionTypeId`) REFERENCES `deduction_types` (`id`)
) ENGINE=InnoDB;

-- ─── Bonus Types ───────────────────────────────────────────────────────────
CREATE TABLE `bonus_types` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Payroll Bonuses ───────────────────────────────────────────────────────
CREATE TABLE `payroll_bonuses` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `staffEmploymentId` int NOT NULL,
  `bonusTypeId` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentDate` timestamp NOT NULL,
  `reason` text,
  `approvedBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`staffEmploymentId`) REFERENCES `staff_employment` (`id`),
  FOREIGN KEY (`bonusTypeId`) REFERENCES `bonus_types` (`id`),
  FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB;

-- ─── Attendance Records ────────────────────────────────────────────────────
CREATE TABLE `attendance_records` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `staffProfileId` int NOT NULL,
  `date` timestamp NOT NULL,
  `hoursWorked` decimal(5,2) NOT NULL DEFAULT '0',
  `status` enum('present','absent','late','half_day','leave') NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles` (`id`)
) ENGINE=InnoDB;

-- ─── Payroll Records ───────────────────────────────────────────────────────
CREATE TABLE `payroll_records` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `staffEmploymentId` int NOT NULL,
  `payrollPeriodStart` timestamp NOT NULL,
  `payrollPeriodEnd` timestamp NOT NULL,
  `grossSalary` decimal(12,2) NOT NULL DEFAULT '0',
  `totalDeductions` decimal(12,2) NOT NULL DEFAULT '0',
  `totalBonuses` decimal(12,2) NOT NULL DEFAULT '0',
  `netPay` decimal(12,2) NOT NULL DEFAULT '0',
  `paymentStatus` enum('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
  `paymentDate` timestamp,
  `paymentMethod` enum('bank_transfer','cash','mpesa','check') NOT NULL DEFAULT 'bank_transfer',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`staffEmploymentId`) REFERENCES `staff_employment` (`id`)
) ENGINE=InnoDB;

-- ─── Payslips ──────────────────────────────────────────────────────────────
CREATE TABLE `payslips` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `payrollRecordId` int NOT NULL,
  `staffEmploymentId` int NOT NULL,
  `payslipNumber` varchar(50) NOT NULL UNIQUE,
  `payrollPeriodStart` timestamp NOT NULL,
  `payrollPeriodEnd` timestamp NOT NULL,
  `grossSalary` decimal(12,2) NOT NULL DEFAULT '0',
  `totalDeductions` decimal(12,2) NOT NULL DEFAULT '0',
  `totalBonuses` decimal(12,2) NOT NULL DEFAULT '0',
  `netPay` decimal(12,2) NOT NULL DEFAULT '0',
  `payslipUrl` text,
  `generatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`payrollRecordId`) REFERENCES `payroll_records` (`id`),
  FOREIGN KEY (`staffEmploymentId`) REFERENCES `staff_employment` (`id`)
) ENGINE=InnoDB;

-- ─── Payroll Settings ──────────────────────────────────────────────────────
CREATE TABLE `payroll_settings` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `branchId` int,
  `nssfRate` decimal(5,2) NOT NULL DEFAULT '6',
  `nhifRate` decimal(5,2) NOT NULL DEFAULT '2.75',
  `payeTaxThreshold` decimal(12,2) NOT NULL DEFAULT '24000',
  `payeRate` decimal(5,2) NOT NULL DEFAULT '30',
  `payrollCycle` enum('weekly','biweekly','monthly') NOT NULL DEFAULT 'monthly',
  `paymentDay` int NOT NULL DEFAULT 28,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB;
