import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const migrationFile = path.join(__dirname, 'drizzle/migrations/add_payroll_management_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    // Split SQL statements by semicolon
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Check if table already exists
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠ Table already exists (statement ${i + 1}), skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyMigration();
