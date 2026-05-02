import { getDb } from "./db";
import { sql } from "drizzle-orm";

/**
 * Initialize database tables on server startup
 * This ensures all required tables exist before the app runs
 */
export async function initializeDatabase() {
  const db = await getDb();
  if (!db) {
    console.warn("[DB Init] Database connection not available");
    return;
  }

  try {
    // Create transaction_logs table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS \`transaction_logs\` (
        \`id\` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`orderId\` int NOT NULL,
        \`customerId\` int,
        \`customerName\` varchar(255) NOT NULL,
        \`time\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`cash\` decimal(10,2) NOT NULL DEFAULT 0,
        \`card\` decimal(10,2) NOT NULL DEFAULT 0,
        \`mpesa\` decimal(10,2) NOT NULL DEFAULT 0,
        \`wallet\` decimal(10,2) NOT NULL DEFAULT 0,
        \`check\` decimal(10,2) NOT NULL DEFAULT 0,
        \`totalAmount\` decimal(10,2) NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`transaction_logs_orderId_orders_id_fk\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`transaction_logs_customerId_customers_id_fk\` FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create indexes
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS \`transaction_logs_time_idx\` ON \`transaction_logs\` (\`time\`)`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS \`transaction_logs_customerName_idx\` ON \`transaction_logs\` (\`customerName\`)`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS \`transaction_logs_customerId_idx\` ON \`transaction_logs\` (\`customerId\`)`
    );

    console.log("[DB Init] ✓ Database initialization completed");
  } catch (error) {
    console.error("[DB Init] Error initializing database:", error);
    // Don't throw - let the app continue even if initialization fails
  }
}
