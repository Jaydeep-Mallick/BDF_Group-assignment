-- RoboRoom Club – Database Schema
-- Contribution: C. Jaswanth Kumar (Roll No: 252U1R9026)

PRAGMA foreign_keys = ON;

-- Table 1: builders
CREATE TABLE IF NOT EXISTS builders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- Table 2: robots
CREATE TABLE IF NOT EXISTS robots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL
);

-- Table 3: loans
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  builder_id INTEGER NOT NULL,
  robot_id INTEGER NOT NULL,
  loan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  return_date DATETIME DEFAULT NULL,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE RESTRICT,
  FOREIGN KEY (robot_id) REFERENCES robots(id) ON DELETE RESTRICT
);

-- Database-backed counter for unique, sequential, transaction-safe robot code generation
-- Contribution: G. Sudeshna (Roll No: 252U1R9039)
CREATE TABLE IF NOT EXISTS robot_code_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_number INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO robot_code_counter (id, last_number) VALUES (1, 0);

-- Trigger: Prevent multiple active loans for the same robot simultaneously (return_date IS NULL)
CREATE TRIGGER IF NOT EXISTS prevent_duplicate_active_robot_loans
BEFORE INSERT ON loans
FOR EACH ROW
WHEN (
  SELECT COUNT(*) FROM loans
  WHERE robot_id = NEW.robot_id AND return_date IS NULL
) >= 1
BEGIN
  SELECT RAISE(ABORT, 'Robot is currently on loan');
END;

