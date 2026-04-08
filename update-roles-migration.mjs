import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  connectionLimit: 1,
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('//')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'kenya_pos',
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  queueLimit: 0,
  supportBigNumbers: true,
  bigNumberStrings: true,
});

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting roles migration...');
    
    // Disable strict mode temporarily
    console.log('Disabling strict SQL mode...');
    await connection.execute(`SET sql_mode=''`);
    
    // First, update existing 'user' roles to 'waiter'
    console.log('Converting existing user roles to waiter...');
    await connection.execute(`
      UPDATE users SET role = 'waiter' WHERE role = 'user'
    `);
    console.log('✅ Updated user roles to waiter');
    
    // Convert ENUM to VARCHAR to allow all new roles
    console.log('Converting role column from ENUM to VARCHAR...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role VARCHAR(50) DEFAULT 'waiter' NOT NULL
    `);
    console.log('✅ Converted role column to VARCHAR');
    
    console.log('✅ Successfully updated roles system');
    console.log('Available roles: admin, manager, supervisor, cashier, waiter, inventory_manager, kitchen_staff');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

migrate().catch(console.error);
