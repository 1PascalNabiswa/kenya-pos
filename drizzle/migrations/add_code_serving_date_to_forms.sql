-- Add code and servingDate columns to forms table
ALTER TABLE forms ADD COLUMN code VARCHAR(50) NOT NULL AFTER title;
ALTER TABLE forms ADD COLUMN servingDate TIMESTAMP NULL AFTER status;
ALTER TABLE forms ADD UNIQUE KEY uk_forms_code (code);
