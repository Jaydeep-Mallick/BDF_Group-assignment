/**
 * RoboRoom Club – Robot Loan Management System
 * Main Express Application Server
 * Contribution: C. Jaswanth Kumar (Roll No: 252U1R9026) - Server, routes and database setup
 */

const express = require('express');
const { initDb } = require('./database/db');

const robotRoutes = require('./routes/robots');
const builderRoutes = require('./routes/builders');
const loanRoutes = require('./routes/loans');

// Initialize database
initDb();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());

// API Root / Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'RoboRoom Club',
    description: 'Robot Loan Management System',
    status: 'online',
    version: '1.0.0',
    documentation: '/README.md'
  });
});

// Modular Routes
app.use('/robots', robotRoutes);
app.use('/builders', builderRoutes);
app.use('/loans', loanRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  // SQLite Constraint Violations
  if (err.code === 'SQLITE_CONSTRAINT') {
    if (err.message && err.message.includes('Robot is currently on loan')) {
      return res.status(409).json({ error: 'Robot is currently on loan' });
    }
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Unique constraint violation' });
    }
    if (err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(409).json({ error: 'Referential integrity violation' });
    }
    return res.status(409).json({ error: err.message || 'Database constraint violation' });
  }

  // Malformed JSON payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
});

// Start listening when run directly
let server = null;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`[RoboRoom Club] Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server };

