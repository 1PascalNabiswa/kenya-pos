-- Create order_payments table to track split payment details
CREATE TABLE IF NOT EXISTS order_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  paymentMethod ENUM('cash', 'mpesa', 'stripe', 'wallet') NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  mpesaPhone VARCHAR(20),
  mpesaTransactionId VARCHAR(100),
  stripePaymentIntentId VARCHAR(100),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_orderId (orderId),
  INDEX idx_status (status)
);

-- Create order_item_payments table to track which payment method was used for each item
CREATE TABLE IF NOT EXISTS order_item_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderItemId INT NOT NULL,
  orderPaymentId INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (orderItemId) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (orderPaymentId) REFERENCES order_payments(id) ON DELETE CASCADE,
  INDEX idx_orderItemId (orderItemId),
  INDEX idx_orderPaymentId (orderPaymentId)
);
