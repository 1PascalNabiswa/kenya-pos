import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

// Parse MySQL connection string
const parseConnectionString = (url) => {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: urlObj.port || 3306,
    user: urlObj.username,
    password: urlObj.password,
    database: urlObj.pathname.slice(1),
    ssl: urlObj.searchParams.get('ssl') ? JSON.parse(urlObj.searchParams.get('ssl')) : true,
  };
};

const config = parseConnectionString(DATABASE_URL);

const roleDefaults = {
  admin: {
    low_stock_alert: { enabled: true, frequency: 'instant' },
    large_transaction: { enabled: true, frequency: 'instant' },
    new_form_creation: { enabled: true, frequency: 'instant' },
    new_user_login: { enabled: true, frequency: 'instant' },
    payment_failure: { enabled: true, frequency: 'instant' },
    daily_summary: { enabled: true, frequency: 'daily' },
  },
  manager: {
    low_stock_alert: { enabled: true, frequency: 'instant' },
    large_transaction: { enabled: true, frequency: 'instant' },
    new_form_creation: { enabled: true, frequency: 'instant' },
    new_user_login: { enabled: false, frequency: 'instant' },
    payment_failure: { enabled: true, frequency: 'instant' },
    daily_summary: { enabled: true, frequency: 'daily' },
  },
  supervisor: {
    low_stock_alert: { enabled: true, frequency: 'instant' },
    large_transaction: { enabled: false, frequency: 'instant' },
    new_form_creation: { enabled: true, frequency: 'instant' },
    new_user_login: { enabled: false, frequency: 'instant' },
    payment_failure: { enabled: true, frequency: 'instant' },
    daily_summary: { enabled: false, frequency: 'daily' },
  },
  cashier: {
    low_stock_alert: { enabled: false, frequency: 'instant' },
    large_transaction: { enabled: false, frequency: 'instant' },
    new_form_creation: { enabled: false, frequency: 'instant' },
    new_user_login: { enabled: false, frequency: 'instant' },
    payment_failure: { enabled: true, frequency: 'instant' },
    daily_summary: { enabled: false, frequency: 'daily' },
  },
  waiter: {
    low_stock_alert: { enabled: false, frequency: 'instant' },
    large_transaction: { enabled: false, frequency: 'instant' },
    new_form_creation: { enabled: false, frequency: 'instant' },
    new_user_login: { enabled: false, frequency: 'instant' },
    payment_failure: { enabled: false, frequency: 'instant' },
    daily_summary: { enabled: false, frequency: 'daily' },
  },
  inventory_manager: {
    low_stock_alert: { enabled: true, frequency: 'instant' },
    large_transaction: { enabled: false, frequency: 'instant' },
    new_form_creation: { enabled: false, frequency: 'instant' },
    new_user_login: { enabled: false, frequency: 'instant' },
    payment_failure: { enabled: false, frequency: 'instant' },
    daily_summary: { enabled: false, frequency: 'daily' },
  },
  kitchen_staff: {
    low_stock_alert: { enabled: false, frequency: 'instant' },
    large_transaction: { enabled: false, frequency: 'instant' },
    new_form_creation: { enabled: false, frequency: 'instant' },
    new_user_login: { enabled: false, frequency: 'instant' },
    payment_failure: { enabled: false, frequency: 'instant' },
    daily_summary: { enabled: false, frequency: 'daily' },
  },
};

async function initializeNotificationPreferences() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to database');

    // Get all users
    const [users] = await connection.query('SELECT id, role FROM users');
    console.log(`Found ${users.length} users`);

    let initialized = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if user already has preferences
      const [existing] = await connection.query(
        'SELECT COUNT(*) as count FROM notification_preferences WHERE userId = ?',
        [user.id]
      );

      if (existing[0].count > 0) {
        console.log(`User ${user.id} already has preferences, skipping`);
        skipped++;
        continue;
      }

      // Get role defaults
      const defaults = roleDefaults[user.role] || roleDefaults.waiter;

      // Insert preferences for this user
      for (const [notificationType, prefs] of Object.entries(defaults)) {
        await connection.query(
          'INSERT INTO notification_preferences (userId, notificationType, enabled, frequency) VALUES (?, ?, ?, ?)',
          [user.id, notificationType, prefs.enabled ? 1 : 0, prefs.frequency]
        );
      }

      console.log(`Initialized preferences for user ${user.id} (${user.role})`);
      initialized++;
    }

    console.log(`\nInitialization complete!`);
    console.log(`- Initialized: ${initialized} users`);
    console.log(`- Skipped: ${skipped} users`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeNotificationPreferences();
