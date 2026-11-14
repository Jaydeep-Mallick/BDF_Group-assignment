/**
 * RoboRoom Club – Robot Routes
 * Contribution: Jaydeep Mallick (Roll No: 252U1R9047) - REST endpoints (CRUD)
 * Contribution: Rithwik Reddy (Roll No: 252U1R9059) - Validation & Search
 * Contribution: G. Sudeshna (Roll No: 252U1R9039) - Automatic code generation & code immutability
 */

const express = require('express');
const router = express.Router();
const { getDb, generateNextRobotCode } = require('../database/db');
const { validateId, validateRobotInput } = require('../validation');

/**
 * GET /robots
 * Retrieve all robots.
 * Supports query parameter-based case-insensitive search by kind and name.
 * Example: GET /robots?kind=Humanoid&name=Robo
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const { kind, name } = req.query;

    let query = 'SELECT id, code, name, kind FROM robots WHERE 1=1';
    const params = [];

    if (kind && typeof kind === 'string' && kind.trim().length > 0) {
      query += ' AND LOWER(kind) LIKE ?';
      params.push(`%${kind.trim().toLowerCase()}%`);
    }

    if (name && typeof name === 'string' && name.trim().length > 0) {
      query += ' AND LOWER(name) LIKE ?';
      params.push(`%${name.trim().toLowerCase()}%`);
    }

    query += ' ORDER BY id ASC';

    const robots = db.prepare(query).all(...params);
    return res.status(200).json(robots);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /robots/:id
 * Retrieve a specific robot by ID.
 */
router.get('/:id', (req, res, next) => {
  try {
    const idCheck = validateId(req.params.id, 'Robot ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const robot = db.prepare('SELECT id, code, name, kind FROM robots WHERE id = ?').get(idCheck.id);

    if (!robot) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    return res.status(200).json(robot);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /robots
 * Create a new robot.
 * Special Twist:
 * - Server automatically generates unique sequential code (ROB-0001, ROB-0002, etc.).
 * - Client cannot set code (any client-supplied code is overridden).
 * - Code generation uses database-backed transaction-safe counter.
 */
router.post('/', (req, res, next) => {
  try {
    const validation = validateRobotInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, kind } = validation.data;
    const db = getDb();

    // Perform code generation and insertion in an atomic transaction
    const createRobotTx = db.transaction(() => {
      const code = generateNextRobotCode(db);
      const stmt = db.prepare('INSERT INTO robots (code, name, kind) VALUES (?, ?, ?)');
      const info = stmt.run(code, name, kind);
      return db.prepare('SELECT id, code, name, kind FROM robots WHERE id = ?').get(info.lastInsertRowid);
    });

    const newRobot = createRobotTx();
    return res.status(201).json(newRobot);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /robots/:id
 * Update an existing robot.
 * Special Twist:
 * - Original robot code remains unchanged.
 * - Client attempts to modify code (e.g., { "code": "ROB-9999" }) are ignored; code is immutable.
 */
router.put('/:id', (req, res, next) => {
  try {
    const idCheck = validateId(req.params.id, 'Robot ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id, code FROM robots WHERE id = ?').get(idCheck.id);
    if (!existing) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    const validation = validateRobotInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, kind } = validation.data;

    // Update name and kind ONLY. The existing code is strictly preserved.
    db.prepare('UPDATE robots SET name = ?, kind = ? WHERE id = ?').run(name, kind, idCheck.id);

    const updated = db.prepare('SELECT id, code, name, kind FROM robots WHERE id = ?').get(idCheck.id);
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /robots/:id
 * Delete an existing robot, provided it has no loan history.
 * Deleted robot codes are NOT reused by future robots.
 */
router.delete('/:id', (req, res, next) => {
  try {
    const idCheck = validateId(req.params.id, 'Robot ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM robots WHERE id = ?').get(idCheck.id);
    if (!existing) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    // Check referential integrity: reject deletion if robot has loans
    const loanCount = db.prepare('SELECT COUNT(*) as count FROM loans WHERE robot_id = ?').get(idCheck.id);
    if (loanCount && loanCount.count > 0) {
      return res.status(409).json({ error: 'Cannot delete robot with existing loan records' });
    }

    db.prepare('DELETE FROM robots WHERE id = ?').run(idCheck.id);
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' || err.message.includes('FOREIGN KEY')) {
      return res.status(409).json({ error: 'Cannot delete robot with existing loan records' });
    }
    return next(err);
  }
});

module.exports = router;

