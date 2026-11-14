/**
 * RoboRoom Club – Database Connection & Management Module
 * Contribution: C. Jaswanth Kumar (Roll No: 252U1R9026) - Database setup & relationships
 * Contribution: G. Sudeshna (Roll No: 252U1R9039) - Database-backed sequential robot code generation
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const defaultDbPath = path.join(__dirname, '..', 'data', 'roboroom.db');
let currentDbPath = process.env.DB_PATH || defaultDbPath;

let dbInstance = null;

/**
 * Initializes the SQLite database, enables foreign keys and runs schema definitions.
 * @param {string} [customPath] - Custom SQLite file path (used for isolated tests)
 * @returns {Database.Database} Active SQLite database instance
 */
function initDb(customPath) {
  if (customPath) {
    currentDbPath = customPath;
    if (dbInstance && dbInstance.open) {
      dbInstance.close();
    }
    dbInstance = null;
  }

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

  // Automatically seed default robot records idempotently
  seedDefaultRobots(dbInstance);

  return dbInstance;
}

/**
 * Default robots to be seeded automatically upon database initialization.
 */
const defaultRobots = [
  { code: 'ROB-0001', name: 'Robo Alpha', kind: 'Humanoid' },
  { code: 'ROB-0002', name: 'Robo Beta', kind: 'Wheeled' },
  { code: 'ROB-0003', name: 'Robo Gamma', kind: 'Industrial' },
  { code: 'ROB-0004', name: 'Robo Delta', kind: 'Autonomous' }
];

/**
 * Idempotently seeds the database with the default four robots.
 * - Inserts only missing robots (preserves existing IDs and data).
 * - Does not create duplicates on server restarts.
 * - Does not overwrite existing robot information.
 * - Ensures persistent sequence counter is synchronized to at least 4.
 * @param {Database.Database} db
 */
function seedDefaultRobots(db) {
  const seedTx = db.transaction(() => {
    const insertStmt = db.prepare('INSERT INTO robots (code, name, kind) VALUES (?, ?, ?)');

    for (const robot of defaultRobots) {
      // Check if robot with this code or name already exists
      const existing = db.prepare('SELECT id, code FROM robots WHERE code = ? OR name = ?').get(robot.code, robot.name);
      if (!existing) {
        insertStmt.run(robot.code, robot.name, robot.kind);
      }
    }

    // Determine the highest numeric code suffix currently in use
    const allRobots = db.prepare('SELECT code FROM robots').all();
    let maxNum = defaultRobots.length;
    for (const r of allRobots) {
      const match = r.code && r.code.match(/^ROB-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }

    // Ensure the persistent counter is at least the highest code number
    const counterRow = db.prepare('SELECT last_number FROM robot_code_counter WHERE id = 1').get();
    const currentCounter = counterRow ? counterRow.last_number : 0;
    if (currentCounter < maxNum) {
      db.prepare('UPDATE robot_code_counter SET last_number = ? WHERE id = 1').run(maxNum);
    }
  });

  seedTx();
}

/**
 * Retrieves current database connection, initializing if needed.
 */
function getDb() {
  if (!dbInstance || !dbInstance.open) {
    return initDb();
  }
  return dbInstance;
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
  generateNextRobotCode,
  seedDefaultRobots,
  defaultRobots,
  get db() {
    return getDb();
  }
};

