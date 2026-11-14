/**
 * RoboRoom Club – Database Connection & Management Module
 * Contribution: C. Jaswanth Kumar (Roll No: 252U1R9026) - Database setup & relationships
 * Contribution: G. Sudeshna (Roll No: 252U1R9039) - Database-backed sequential robot code generation
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const defaultDbPath = path.join(__dirname, '..', 'data', 'roboroom.db');

/**
 * Resolves database file path supporting DB_PATH environment variable,
 * explicit custom paths, or the default roboroom.db.
 * @param {string} [targetPath]
 * @returns {string} Absolute file path or ':memory:'
 */
function resolveDbPath(targetPath) {
  const chosen = targetPath !== undefined ? targetPath : (process.env.DB_PATH || defaultDbPath);
  if (chosen === ':memory:') {
    return ':memory:';
  }
  return path.resolve(chosen);
}

let currentDbPath = resolveDbPath();
let dbInstance = null;

/**
 * Initializes the SQLite database, enables foreign keys and runs schema definitions.
 * Connects to DB_PATH if provided, or the default database.
 * @param {string} [customPath] - Custom SQLite file path (used for isolated tests)
 * @returns {Database.Database} Active SQLite database instance
 */
function initDb(customPath) {
  const targetPath = resolveDbPath(customPath);

  if (dbInstance && (customPath || currentDbPath !== targetPath)) {
    if (dbInstance.open) {
      dbInstance.close();
    }
    dbInstance = null;
  }

  currentDbPath = targetPath;

  if (dbInstance && dbInstance.open) {
    return dbInstance;
  }

  // Ensure target folder exists if using file storage
  if (currentDbPath !== ':memory:') {
    const dir = path.dirname(currentDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Open database connection
  dbInstance = new Database(currentDbPath);

  // Enable SQLite foreign key constraints
  dbInstance.pragma('foreign_keys = ON');

  // Use WAL journal mode for performance and concurrent safety
  if (currentDbPath !== ':memory:') {
    dbInstance.pragma('journal_mode = WAL');
  }

  // Execute schema definitions
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  dbInstance.exec(schemaSql);

  // Synchronize SQLite AUTOINCREMENT sequence with current max IDs
  syncSequences(dbInstance);

  return dbInstance;
}

/**
 * Synchronizes SQLite AUTOINCREMENT sequence counters with current maximum IDs.
 * Prevents gap inflation if records with higher IDs were deleted.
 * @param {Database.Database} db
 */
function syncSequences(db) {
  try {
    const tables = ['robots', 'builders', 'loans'];
    for (const table of tables) {
      const maxRow = db.prepare(`SELECT COALESCE(MAX(id), 0) AS max_id FROM ${table}`).get();
      const maxId = maxRow ? maxRow.max_id : 0;
      const seqRow = db.prepare('SELECT seq FROM sqlite_sequence WHERE name = ?').get(table);
      if (seqRow && seqRow.seq > maxId) {
        db.prepare('UPDATE sqlite_sequence SET seq = ? WHERE name = ?').run(maxId, table);
      }
    }
  } catch (_) {
    // sqlite_sequence may not exist yet on fresh empty databases
  }
}

/**
 * Retrieves current database connection, initializing if needed.
 * Automatically respects process.env.DB_PATH if set.
 */
function getDb() {
  const expectedPath = resolveDbPath();
  if (!dbInstance || !dbInstance.open || currentDbPath !== expectedPath) {
    return initDb(expectedPath);
  }
  return dbInstance;
}

/**
 * Returns current connected database file path.
 * @returns {string}
 */
function getCurrentDbPath() {
  return currentDbPath;
}

/**
 * Atomically generates the next sequential robot code (ROB-0001, ROB-0002, etc.).
 * Uses a database-backed transaction-safe counter.
 * Deleted robot codes are never reused.
 * @param {Database.Database} [db]
 * @returns {string} Formatted robot code
 */
function generateNextRobotCode(db = getDb()) {
  const codeTx = db.transaction(() => {
    // Atomically increment counter
    db.prepare('UPDATE robot_code_counter SET last_number = last_number + 1 WHERE id = 1').run();
    const row = db.prepare('SELECT last_number FROM robot_code_counter WHERE id = 1').get();
    const num = row ? row.last_number : 1;
    return `ROB-${String(num).padStart(4, '0')}`;
  });

  return codeTx();
}

/**
 * Closes the active database connection.
 */
function closeDb() {
  if (dbInstance && dbInstance.open) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Auto-initialize default database on load
initDb();

module.exports = {
  getDb,
  initDb,
  closeDb,
  getCurrentDbPath,
  generateNextRobotCode,
  get db() {
    return getDb();
  }
};

