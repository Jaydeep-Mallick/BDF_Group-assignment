/**
 * RoboRoom Club – Builder Routes
 * Contribution: Jaydeep Mallick (Roll No: 252U1R9047) - REST endpoints
 * Contribution: Rithwik Reddy (Roll No: 252U1R9059) - Validation
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const { validateId, validateBuilderInput } = require('../validation');

/**
 * GET /builders
 * Retrieve all registered builders.
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const builders = db.prepare('SELECT id, name FROM builders ORDER BY id ASC').all();
    return res.status(200).json(builders);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /builders/:id
 * Retrieve a particular builder by ID.
 */
router.get('/:id', (req, res, next) => {
  try {
    const idCheck = validateId(req.params.id, 'Builder ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const builder = db.prepare('SELECT id, name FROM builders WHERE id = ?').get(idCheck.id);

    if (!builder) {
      return res.status(404).json({ error: 'Builder not found' });
    }

    return res.status(200).json(builder);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /builders
 * Create a new builder.
 * Example body: { "name": "Jaydeep Mallick" }
 */
router.post('/', (req, res, next) => {
  try {
    const validation = validateBuilderInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name } = validation.data;
    const db = getDb();

    const stmt = db.prepare('INSERT INTO builders (name) VALUES (?)');
    const info = stmt.run(name);

    const newBuilder = {
      id: Number(info.lastInsertRowid),
      name
    };

    return res.status(201).json(newBuilder);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /builders/:id
 * Update an existing builder.
 */
router.put('/:id', (req, res, next) => {
  try {
    const idCheck = validateId(req.params.id, 'Builder ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM builders WHERE id = ?').get(idCheck.id);
    if (!existing) {
      return res.status(404).json({ error: 'Builder not found' });
    }

    const validation = validateBuilderInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name } = validation.data;
    db.prepare('UPDATE builders SET name = ? WHERE id = ?').run(name, idCheck.id);

    const updated = db.prepare('SELECT id, name FROM builders WHERE id = ?').get(idCheck.id);
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /builders/:id
 * Delete a builder if they have no associated loans.
 */
router.delete('/:id', (req, res, next) => {
  try {
    const idCheck = validateId(req.params.id, 'Builder ID');
    if (!idCheck.valid) {
      return res.status(400).json({ error: idCheck.error });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM builders WHERE id = ?').get(idCheck.id);
    if (!existing) {
      return res.status(404).json({ error: 'Builder not found' });
    }

    const loanCount = db.prepare('SELECT COUNT(*) as count FROM loans WHERE builder_id = ?').get(idCheck.id);
    if (loanCount && loanCount.count > 0) {
      return res.status(409).json({ error: 'Cannot delete builder with active or past loans' });
    }

    db.prepare('DELETE FROM builders WHERE id = ?').run(idCheck.id);
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' || err.message.includes('FOREIGN KEY')) {
      return res.status(409).json({ error: 'Cannot delete builder with active or past loans' });
    }
    return next(err);
  }
});

module.exports = router;

