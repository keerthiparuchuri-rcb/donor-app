const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bloodconnect.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability and concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema.
 * STRICTLY NO DEMO DATA. NO SEEDING.
 * Starts with empty tables (0 records).
 */
function initSchema() {
  const schema = `
    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_name TEXT NOT NULL,
      registration_number TEXT NOT NULL UNIQUE COLLATE NOCASE,
      contact_number TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      address TEXT NOT NULL,
      pincode TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blood_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      blood_group TEXT NOT NULL,
      units_available INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(hospital_id, blood_group)
    );

    CREATE TABLE IF NOT EXISTS required_blood (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      blood_group TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(hospital_id, blood_group)
    );

    CREATE INDEX IF NOT EXISTS idx_hospitals_pincode ON hospitals(pincode);
    CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(location);
    CREATE INDEX IF NOT EXISTS idx_inventory_group ON blood_inventory(blood_group);
    CREATE INDEX IF NOT EXISTS idx_inventory_units ON blood_inventory(units_available);
  `;

  db.exec(schema);
}

/**
 * Reset database tables to empty state (Schema preserved, 0 rows).
 * Strictly for development resets. No demo data is inserted.
 */
function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS required_blood;
    DROP TABLE IF EXISTS blood_inventory;
    DROP TABLE IF EXISTS hospitals;
  `);
  initSchema();
  return getStats();
}

/**
 * Get current record counts to verify empty / real states.
 */
function getStats() {
  const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get().count;
  const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM blood_inventory').get().count;
  const requiredCount = db.prepare('SELECT COUNT(*) as count FROM required_blood').get().count;
  return {
    hospitals: hospitalCount,
    blood_inventory: inventoryCount,
    required_blood: requiredCount
  };
}

// Initialize tables immediately
initSchema();

module.exports = {
  db,
  initSchema,
  resetDatabase,
  getStats
};
