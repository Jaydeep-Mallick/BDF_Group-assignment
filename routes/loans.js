/**
 * RoboRoom Club – Loan Routes
 * Contribution: Jaydeep Mallick (Roll No: 252U1R9047) - REST endpoints & JOIN endpoint
 * Contribution: Rithwik Reddy (Roll No: 252U1R9059) - Validation
 * Contribution: C. Jaswanth Kumar (Roll No: 252U1R9026) - Database relationships and queries
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const { validateId, validateLoanInput } = require('../validation');

/**
 * GET /loans/details
 * MANDATORY JOIN ENDPOINT
 * Uses relational SQL JOIN between loans, builders, and robots.
 * Returns joined details including builder_name, robot_name, and robot_code.
 * IMPORTANT: Registered before /:id so 'details' is not interpreted as an ID.
 */
router.get('/details', (req, res, next) => {
  try {
    const db = getDb();
    const { status } = req.query;

    let query = `
      SELECT 
        l.id,
        l.builder_id,
        b.name AS builder_name,
        l.robot_id,
        r.name AS robot_name,
        r.code AS robot_code,
        l.loan_date,
        l.return_date
      FROM loans l
      JOIN builders b ON l.builder_id = b.id
      JOIN robots r ON l.robot_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      const lower = String(status).toLowerCase();
      if (lower === 'active') {
        query += ' AND l.return_date IS NULL';
      } else if (lower === 'returned') {
        query += ' AND l.return_date IS NOT NULL';
      }
    }

    query += ' ORDER BY l.id ASC';

    const details = db.prepare(query).all(...params);
    return res.status(200).json(details);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /loans
 * Retrieve all loans with optional filtering.
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const { status, builder_id, robot_id } = req.query;

    let query = 'SELECT id, builder_id, robot_id, loan_date, return_date FROM loans WHERE 1=1';
    const params = [];

    if (status) {
      const lower = String(status).toLowerCase();
      if (lower === 'active') {
        query += ' AND return_date IS NULL';
      } else if (lower === 'returned') {
        query += ' AND return_date IS NOT NULL';
      }
    }

    if (builder_id) {
      const bCheck = validateId(builder_id, 'Builder ID');
      if (bCheck.valid) {
        query += ' AND builder_id = ?';
        params.push(bCheck.id);
      }
    }

    if (robot_id) {
      const rCheck = validateId(robot_id, 'Robot ID');
      if (rCheck.valid) {
        query += ' AND robot_id = ?';
        params.push(rCheck.id);
      }
    }

    query += ' ORDER BY id ASC';

    const loans = db.prepare(query).all(...params);
    return res.status(200).json(loans);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /loans/:id
 * Retrieve a specific loan by ID.
 */
router.get('/:id', (req, res, next) => {
  try {
    const idCheck = validateId(req.params.id, 'Loan ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const loan = db.prepare('SELECT id, builder_id, robot_id, loan_date, return_date FROM loans WHERE id = ?').get(idCheck.id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    return res.status(200).json(loan);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /loans
 * Create a new loan.
 * Validates:
 * - Builder exists.
 * - Robot exists.
 * - Robot does NOT already have an active loan (return_date IS NULL).
 */
router.post('/', (req, res, next) => {
  try {
    const validation = validateLoanInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { builder_id, robot_id } = validation.data;
    const db = getDb();

    // Check whether the builder exists
    const builder = db.prepare('SELECT id FROM builders WHERE id = ?').get(builder_id);
    if (!builder) {
      return res.status(404).json({ error: 'Builder not found' });
    }

    // Check whether the robot exists
    const robot = db.prepare('SELECT id FROM robots WHERE id = ?').get(robot_id);
    if (!robot) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    // Check active loan status and perform insert in an atomic transaction
    const createLoanTx = db.transaction(() => {
      const activeLoan = db.prepare(
        'SELECT id FROM loans WHERE robot_id = ? AND return_date IS NULL'
      ).get(robot_id);

      if (activeLoan) {
        const err = new Error('Robot is currently on loan');
        err.statusCode = 409;
        throw err;
      }

      const stmt = db.prepare(`
        INSERT INTO loans (builder_id, robot_id, loan_date, return_date)
        VALUES (?, ?, datetime('now', 'localtime'), NULL)
      `);
      const info = stmt.run(builder_id, robot_id);

      return db.prepare('SELECT id, builder_id, robot_id, loan_date, return_date FROM loans WHERE id = ?').get(info.lastInsertRowid);
    });

    let newLoan;
    try {
      newLoan = createLoanTx();
    } catch (txErr) {
      if (txErr.message && txErr.message.includes('Robot is currently on loan')) {
        return res.status(409).json({ error: 'Robot is currently on loan' });
      }
      if (txErr.statusCode === 409) {
        return res.status(409).json({ error: txErr.message });
      }
      throw txErr;
    }

    return res.status(201).json(newLoan);
  } catch (err) {
    if (err.message && err.message.includes('Robot is currently on loan')) {
      return res.status(409).json({ error: 'Robot is currently on loan' });
    }
    return next(err);
  }
});

/**
 * Return helper function for returning a robot
 */
function handleReturn(req, res, next) {
  try {
    const idCheck = validateId(req.params.id, 'Loan ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const loan = db.prepare('SELECT id, builder_id, robot_id, loan_date, return_date FROM loans WHERE id = ?').get(idCheck.id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.return_date !== null) {
      return res.status(409).json({ error: 'Loan already returned' });
    }

    db.prepare(`
      UPDATE loans 
      SET return_date = datetime('now', 'localtime') 
      WHERE id = ?
    `).run(idCheck.id);

    const updated = db.prepare('SELECT id, builder_id, robot_id, loan_date, return_date FROM loans WHERE id = ?').get(idCheck.id);
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /loans/:id/return & PUT /loans/:id/return
 * Return a loaned robot, setting return_date to current timestamp.
 * Preserves historical loan record while making the robot available for future loans.
 */
router.post('/:id/return', handleReturn);
router.put('/:id/return', handleReturn);

module.exports = router;

