import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse the database URL
  // Format: mysql://user:password@host:port/database
  const urlObj = new URL(databaseUrl);
  const config = {
    host: urlObj.hostname,
    user: urlObj.username,
    password: urlObj.password,
    database: urlObj.pathname.slice(1),
    port: urlObj.port ? parseInt(urlObj.port) : 3306,
    ssl: {
      rejectUnauthorized: false,
    },
    enableKeepAlive: true,
  };

  console.log(`Connecting to database: ${config.database} at ${config.host}`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✓ Connected to database');

    const migrationFile = path.join(__dirname, 'drizzle/migrations/add_payroll_management_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    // Split SQL statements by semicolon
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`\nFound ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        process.stdout.write(`[${i + 1}/${statements.length}] Executing...`);
        await connection.execute(statement);
        console.log(' ✓');
        successCount++;
      } catch (error) {
        // Check if table already exists
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(' ⚠ (table already exists)');
          skippedCount++;
        } else {
          console.log(` ✗`);
          console.error(`Error: ${error.message}`);
          throw error;
        }
      }
    }

    console.log(`\n✓ Migration completed!`);
    console.log(`  - ${successCount} statements executed`);
    console.log(`  - ${skippedCount} statements skipped (tables already exist)`);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyMigration();
