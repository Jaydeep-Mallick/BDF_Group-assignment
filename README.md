# RoboRoom Club – Robot Loan Management System

[![Node.js](https://img.shields.io/badge/Node.js-v24.15.0-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21.2-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-lightgrey.svg)](https://www.sqlite.org/)
[![Tests](https://img.shields.io/badge/Tests-30%20Passing-brightgreen.svg)]()
[![Postman](https://img.shields.io/badge/Postman-Collection%20v2.1-orange.svg)](https://www.postman.com/)

RoboRoom Club is a specialized, production-ready Robot Loan Management System built for the **Backend Development Fundamentals (BDF)** group assignment. It provides an Express.js backend backed by SQLite for tracking competition robots, builders, and active/historical loan agreements.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Project Objectives](#project-objectives)
- [Technologies Used](#technologies-used)
- [Team Members & Exact Five-Member Contribution Distribution](#team-members--exact-five-member-contribution-distribution)
- [Project Folder Structure](#project-folder-structure)
- [Database Schema & Entity Relationships](#database-schema--entity-relationships)
- [Server Setup & Configuration](#server-setup--configuration)
- [Complete API Endpoint Documentation](#complete-api-endpoint-documentation)
  - [Robot Endpoints](#robot-endpoints)
  - [Builder Endpoints](#builder-endpoints)
  - [Loan Endpoints & Mandatory JOIN Operation](#loan-endpoints--mandatory-join-operation)
- [Input Validation Rules](#input-validation-rules)
- [Search Capabilities](#search-capabilities)
- [Special Twist: Automatic Robot Codes & Code Immutability](#special-twist-automatic-robot-codes--code-immutability)
- [Three Mandatory Twist Tests](#three-mandatory-twist-tests)
- [HTTP Status Codes Reference](#http-status-codes-reference)
- [Postman Collection & Collection Runner Guide](#postman-collection--collection-runner-guide)
- [Automated Testing Suite](#automated-testing-suite)
- [Installation and How to Run](#installation-and-how-to-run)
- [Screenshot Folder Descriptions](#screenshot-folder-descriptions)
- [GitHub Collaboration & Branching Instructions](#github-collaboration--branching-instructions)

---

## Project Overview

RoboRoom Club coordinates competitive robotics teams, builders, and robotic equipment. Robots are loaned out for national and collegiate engineering competitions. The club requires a reliable backend management system to track which robot is currently loaned to which builder, when it was loaned, and when it is returned, while ensuring no robot can ever be assigned to multiple active loans simultaneously.

---

## Problem Statement

Managing high-value robotic assets manually results in scheduling collisions, untracked equipment loans, and inventory confusion. Specifically:
1. **Asset Collision:** Robots could be double-loaned to multiple builders at the same time.
2. **Identification Inconsistency:** Manual identification tags often lead to duplicate or non-sequential identifiers.
3. **Data Integrity:** Lack of referential integrity could lead to orphaned loan records when builders or robots are deleted.

RoboRoom Club solves these problems by providing an automated, transaction-safe backend that generates sequential robot codes (`ROB-0001`, `ROB-0002`...), enforces single-active-loan constraints, and links builders, robots, and loans through SQL relational queries.

---

## Project Objectives

- Implement an Express server on `http://localhost:3000` with modular routing and centralized error handling.
- Build an SQLite relational schema consisting of `builders`, `robots`, and `loans`.
- Enforce foreign keys and referential integrity via `PRAGMA foreign_keys = ON`.
- Develop full REST CRUD operations for robots, builders, and loans.
- Implement the mandatory relational SQL `JOIN` endpoint (`GET /loans/details`).
- Implement strict input validation, ID format checking, and case-insensitive query parameter search.
- Implement the Special Twist: server-side sequential robot codes, client-code overriding, and code immutability during updates.
- Create automated test suites (`tests/api.test.js`, `tests/twist.test.js`) and an executable Postman collection with test assertions.

---

## Technologies Used

- **Runtime Environment:** Node.js (v24.15.0 LTS)
- **Web Application Framework:** Express.js (v4.21.2)
- **Database Engine:** SQLite via `better-sqlite3` (v11.8.1)
- **Programming Language:** JavaScript (ES6+, CommonJS)
- **Automated Testing:** Node.js native test runner (`node:test`) and strict assertions (`node:assert/strict`)
- **API Testing & Verification:** Postman (Collection Schema v2.1.0)

---

## Team Members & Exact Five-Member Contribution Distribution

There are **FIVE members** in this group with five distinct individual technical responsibilities:

1. **C. Jaswanth Kumar**  
   * **Roll Number:** `252U1R9026`  
   * **Responsibilities:** **SERVER, ROUTES AND DATABASE**  
     - **Server & Routes:** Express server setup (`server.js`), modular route configurations, middleware configuration (`express.json()`), and HTTP status code definitions.  
     - **Database:** SQLite database setup (`database/db.js`, `database/schema.sql`), three relational tables, foreign key enforcement, database queries, and database initialization.

2. **Jaydeep Mallick**  
   * **Roll Number:** `252U1R9047`  
   * **Responsibility:** **REST ENDPOINTS**  
     - REST endpoints for builders (`routes/builders.js`).  
     - REST endpoints for robots (`routes/robots.js` - full CRUD operations: `GET`, `POST`, `PUT`, `DELETE`).  
     - REST endpoints for loans (`routes/loans.js`).  
     - Mandatory SQL relational `JOIN` endpoint (`GET /loans/details`) returning builder name, robot name, and robot code.

3. **Rithwik Reddy**  
   * **Roll Number:** `252U1R9059`  
   * **Responsibility:** **VALIDATION AND SEARCH**  
     - Input validation on create and update (`validation.js`).  
     - String trimming and rejection of empty/whitespace-only values.  
     - Positive integer ID validation and clear JSON error messages.  
     - Query parameter-based search (`GET /robots?kind=` and `GET /robots?name=`) with parameterized SQL queries.

4. **G. Sudeshna**  
   * **Roll Number:** `252U1R9039`  
   * **Responsibility:** **TWIST RULE – AUTOMATIC ROBOT CODES**  
     - Automatic sequential robot code generation (`ROB-0001`, `ROB-0002`...).  
     - Server-side generation ensuring clients cannot set or inject custom codes.  
     - Code immutability: ensuring `PUT /robots/:id` never modifies an existing robot code.  
     - Concurrency-safe, database-backed counter preventing reuse of deleted robot codes.  
     - Authoring and passing all three mandatory twist evaluation tests.

5. **Bhargava Sai**  
   * **Roll Number:** `252U1R9055`  
   * **Responsibility:** **POSTMAN AND README**  
     - Complete executable Postman collection (`postman/RoboRoom-Club.postman_collection.json`) with dynamic collection variables.  
     - Automated test scripts embedded in every Postman request for Collection Runner execution.  
     - Comprehensive project `README.md` documentation and instructions.  
     - Automated test suites (`tests/api.test.js`, `tests/twist.test.js`).

---

## Project Folder Structure

```text
RoboRoom-Club/
│
├── routes/
│   ├── builders.js                        # Builder REST endpoints
│   ├── robots.js                          # Robot REST endpoints & search
│   └── loans.js                           # Loan REST endpoints & mandatory JOIN
│
├── database/
│   ├── db.js                              # SQLite connection & code generator helper
│   └── schema.sql                         # Table schemas, foreign keys & triggers
│
├── data/
│   ├── .gitkeep                           # Git directory placeholder
│   └── roboroom.db                        # Local SQLite database (ignored by git)
│
├── tests/
│   ├── api.test.js                        # Complete API automated tests
│   └── twist.test.js                      # Three mandatory twist tests
│
├── postman/
│   └── RoboRoom-Club.postman_collection.json # Executable Postman collection
│
├── Jaydeep_screenshot/
│   └── README.md                          # REST & JOIN screenshot checklist
│
├── Jaswanth_screenshot/
│   └── README.md                          # Server & database screenshot checklist
│
├── Rithwik_screenshot/
│   └── README.md                          # Validation & search screenshot checklist
│
├── Sudeshna_screenshot/
│   └── README.md                          # Twist rule screenshot checklist
│
├── Bhargava_screenshot/
│   └── README.md                          # Postman & automated tests screenshot checklist
│
├── server.js                              # Express app, middleware & route mounting
├── validation.js                          # Validation rules & ID checkers
├── package.json                           # Dependencies, project metadata & npm test script
├── package-lock.json                      # Dependency lockfile
├── .gitignore                             # Git ignore rules for node_modules, .db, logs
└── README.md                              # Complete project documentation
```

---

## Database Schema & Entity Relationships

The SQLite database implements exactly three primary relational tables, plus a database-backed sequence counter for the twist rule:

### 1. `builders` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique builder identifier |
| `name` | `TEXT` | `NOT NULL` | Full name of the robot builder |

### 2. `robots` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique robot identifier |
| `code` | `TEXT` | `UNIQUE NOT NULL` | Unique sequential code (e.g. `ROB-0001`) |
| `name` | `TEXT` | `NOT NULL` | Robot model or combat name |
| `kind` | `TEXT` | `NOT NULL` | Classification (e.g. Humanoid, Wheeled, Combat) |

### 3. `loans` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique loan agreement identifier |
| `builder_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY REFERENCES builders(id)` | Assigned builder |
| `robot_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY REFERENCES robots(id)` | Loaned robot |
| `loan_date` | `DATETIME`| `DEFAULT CURRENT_TIMESTAMP` | Checkout timestamp |
| `return_date` | `DATETIME`| `DEFAULT NULL` | Return timestamp (`NULL` indicates active loan) |

### 4. `robot_code_counter` Table (Database-Backed Twist Counter)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY CHECK (id = 1)` | Singleton identifier |
| `last_number` | `INTEGER` | `NOT NULL DEFAULT 0` | Monotonically increasing counter for codes |

### Relational Model
- **One builder can have multiple loans** ($1:N$).
- **One robot can have multiple historical loans** ($1:N$).
- **Active Loan Constraint:** A robot cannot have more than one active loan (`return_date IS NULL`) at the same time. Enforced via both SQLite trigger `prevent_duplicate_active_robot_loans` and route transaction checks.

---

## Server Setup & Configuration

- **Default Address:** `http://localhost:3000`
- **Port Override:** Controlled via environment variable `PORT` (e.g. `PORT=5000 npm start`).
- **Body Parser:** Configured with `express.json()`.
- **Database Connection:** Auto-initialized on server boot (`initDb()`).
- **Error Handling:** Centralized middleware converting SQLite foreign key and uniqueness violations into structured HTTP 409 responses, and bad JSON into HTTP 400 responses.

---

## Complete API Endpoint Documentation

Base URL: `http://localhost:3000`

### Robot Endpoints

#### 1. Retrieve All Robots
* **Method:** `GET`
* **Route:** `/robots`
* **Query Parameters (Optional):**
  * `kind` (string): Case-insensitive filter on robot kind.
  * `name` (string): Case-insensitive substring filter on robot name.
* **Status Code:** `200 OK`
* **Example Response:**
  ```json
  [
    {
      "id": 1,
      "code": "ROB-0001",
      "name": "Robo Alpha",
      "kind": "Humanoid"
    },
    {
      "id": 2,
      "code": "ROB-0002",
      "name": "Robo Beta",
      "kind": "Wheeled"
    }
  ]
  ```

#### 2. Retrieve Robot by ID
* **Method:** `GET`
* **Route:** `/robots/:id`
* **Status Codes:** `200 OK`, `400 Bad Request` (invalid ID), `404 Not Found` (robot not found)
* **Example Response (200 OK):**
  ```json
  {
    "id": 1,
    "code": "ROB-0001",
    "name": "Robo Alpha",
    "kind": "Humanoid"
  }
  ```

#### 3. Create Robot (Automatic Code Generation)
* **Method:** `POST`
* **Route:** `/robots`
* **Headers:** `Content-Type: application/json`
* **Example Request Body:**
  ```json
  {
    "name": "Robo Alpha",
    "kind": "Humanoid"
  }
  ```
* **Status Codes:** `201 Created`, `400 Bad Request`
* **Behavior:** Server automatically assigns the next sequential code (`ROB-0001`). If client passes a `code` field, it is overridden.
* **Example Response (201 Created):**
  ```json
  {
    "id": 1,
    "code": "ROB-0001",
    "name": "Robo Alpha",
    "kind": "Humanoid"
  }
  ```

#### 4. Update Robot (Code Immutability)
* **Method:** `PUT`
* **Route:** `/robots/:id`
* **Headers:** `Content-Type: application/json`
* **Example Request Body:**
  ```json
  {
    "name": "Robo Alpha Updated",
    "kind": "Humanoid",
    "code": "ROB-9999"
  }
  ```
* **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`
* **Behavior:** Updates name and kind. The robot's original code remains strictly unchanged (`ROB-0001`).
* **Example Response (200 OK):**
  ```json
  {
    "id": 1,
    "code": "ROB-0001",
    "name": "Robo Alpha Updated",
    "kind": "Humanoid"
  }
  ```

#### 5. Delete Robot
* **Method:** `DELETE`
* **Route:** `/robots/:id`
* **Status Codes:** `204 No Content`, `400 Bad Request`, `404 Not Found`, `409 Conflict` (if robot has loan history)

---

### Builder Endpoints

#### 1. Retrieve All Builders
* **Method:** `GET`
* **Route:** `/builders`
* **Status Code:** `200 OK`
* **Example Response:**
  ```json
  [
    {
      "id": 1,
      "name": "Jaydeep Mallick"
    }
  ]
  ```

#### 2. Retrieve Builder by ID
* **Method:** `GET`
* **Route:** `/builders/:id`
* **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`

#### 3. Create Builder
* **Method:** `POST`
* **Route:** `/builders`
* **Headers:** `Content-Type: application/json`
* **Example Request Body:**
  ```json
  {
    "name": "Jaydeep Mallick"
  }
  ```
* **Status Codes:** `201 Created`, `400 Bad Request`

---

### Loan Endpoints & Mandatory JOIN Operation

#### 1. Retrieve All Loans
* **Method:** `GET`
* **Route:** `/loans`
* **Query Parameters (Optional):** `?status=active`, `?status=returned`, `?builder_id=`, `?robot_id=`
* **Status Code:** `200 OK`

#### 2. Mandatory JOIN Endpoint
* **Method:** `GET`
* **Route:** `/loans/details`
* **Description:** Performs a relational SQL `INNER JOIN` combining `loans`, `builders`, and `robots`.
* **Status Code:** `200 OK`
* **Example Response:**
  ```json
  [
    {
      "id": 1,
      "builder_id": 1,
      "builder_name": "Jaydeep Mallick",
      "robot_id": 1,
      "robot_name": "Robo Alpha",
      "robot_code": "ROB-0001",
      "loan_date": "2026-11-14 11:00:00",
      "return_date": null
    }
  ]
  ```

#### 3. Retrieve Loan by ID
* **Method:** `GET`
* **Route:** `/loans/:id`
* **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`

#### 4. Create Loan
* **Method:** `POST`
* **Route:** `/loans`
* **Headers:** `Content-Type: application/json`
* **Example Request Body:**
  ```json
  {
    "builder_id": 1,
    "robot_id": 1
  }
  ```
* **Status Codes:**
  * `201 Created`: Loan created successfully.
  * `400 Bad Request`: Missing or invalid builder/robot ID.
  * `404 Not Found`: Builder or robot does not exist.
  * `409 Conflict`: Robot is already on an active loan (`{"error": "Robot is currently on loan"}`).

#### 5. Return Loan
* **Method:** `POST /loans/:id/return` or `PUT /loans/:id/return`
* **Status Codes:**
  * `200 OK`: Camera/robot returned; `return_date` timestamp set.
  * `400 Bad Request`: Invalid loan ID format.
  * `404 Not Found`: Loan not found.
  * `409 Conflict`: Loan was already returned (`{"error": "Loan already returned"}`).

---

## Input Validation Rules

Implemented in `validation.js` and enforced on all create and update operations:
1. **ID Parameters:** Must be strictly positive integers (`1, 2, 3...`). Non-numeric strings (`"abc"`), negative numbers (`-1`), zero (`0`), and decimals (`1.5`) are rejected with `400 Bad Request`.
2. **Robot Input Validation:**
   - `name`: String, non-empty, rejected if whitespace-only, trimmed, max 100 characters.
   - `kind`: String, non-empty, rejected if whitespace-only, trimmed, max 100 characters.
3. **Builder Input Validation:**
   - `name`: String, non-empty, rejected if whitespace-only, trimmed, max 100 characters.
4. **Loan Input Validation:**
   - `builder_id` and `robot_id`: Required positive integers, verified against database records.
5. **Standard Error Schema:**
   ```json
   {
     "error": "Descriptive validation message"
   }
   ```

---

## Search Capabilities

All search functionality uses parameterized SQL queries to prevent SQL injection vulnerabilities:

| Endpoint | Query Parameter | Example | Result |
| :--- | :--- | :--- | :--- |
| `/robots` | `kind` | `/robots?kind=Humanoid` | Returns robots matching kind `Humanoid` (case-insensitive) |
| `/robots` | `name` | `/robots?name=Robo` | Returns robots containing substring `Robo` (case-insensitive) |
| `/loans` | `status` | `/loans?status=active` | Returns active loans (`return_date IS NULL`) |
| `/loans` | `status` | `/loans?status=returned` | Returns completed loans (`return_date IS NOT NULL`) |

---

## Special Twist: Automatic Robot Codes & Code Immutability

Contribution: **G. Sudeshna (Roll No: 252U1R9039)**

### Rules:
1. **Server-Generated Sequential Codes:** Every newly created robot automatically receives a code in the exact format:
   - `ROB-0001`
   - `ROB-0002`
   - `ROB-0003`
   - `ROB-0004`
2. **Client Cannot Set Code:** If a client provides a `code` field in `POST /robots`, the server ignores it and assigns the next sequential code.
3. **Code Immutability During Updates:** `PUT /robots/:id` will update name and kind, but the robot's existing code remains completely unchanged, even if the client explicitly passes a different code (e.g. `"code": "ROB-9999"`).
4. **Deleted Robot Codes Are Not Reused:** Sequence numbering is backed by a database table `robot_code_counter`. Deleting a robot does not roll back the counter.
5. **Concurrency Safety:** Generation is executed inside an atomic SQLite transaction (`db.transaction`).

---

## Three Mandatory Twist Tests

The project includes dedicated automated tests in `tests/twist.test.js` verifying the three mandatory twist requirements:

| Test | Action | Expected Status | Expected Code Behavior | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Mandatory Test 1** | Add first robot (`POST /robots`) | `201 Created` | Receives code `ROB-0001` | **PASSED** |
| **Mandatory Test 2** | Add second robot (`POST /robots`) | `201 Created` | Receives code `ROB-0002` | **PASSED** |
| **Mandatory Test 3** | Update first robot with `"code": "ROB-9999"` (`PUT /robots/:id`) | `200 OK` | Name/kind updates, code remains `ROB-0001` | **PASSED** |

---

## HTTP Status Codes Reference

- `200 OK`: Successful resource retrieval, update (`PUT`), and loan return (`POST /loans/:id/return`).
- `201 Created`: Successful resource creation (`POST /robots`, `POST /builders`, `POST /loans`).
- `204 No Content`: Successful resource deletion (`DELETE /robots/:id`).
- `400 Bad Request`: Validation failure, missing fields, or invalid ID format.
- `404 Not Found`: Resource ID not found.
- `409 Conflict`: Active loan collision (robot currently on loan), duplicate loan return, or referential integrity deletion violation.
- `500 Internal Server Error`: Unhandled server exception.

---

## Postman Collection & Collection Runner Guide

Location: `postman/RoboRoom-Club.postman_collection.json`

### Collection Features
- Contains 6 organized folders covering all endpoints, search, validation, and the twist lifecycle.
- Uses collection variable `baseUrl = http://localhost:3000`.
- Automatically captures created IDs into variables (`testRobotId`, `testBuilderId`, `testLoanId`, `twistRobot1Id`, etc.).
- Fully executable in **Postman Collection Runner** without requiring prior database records.

### How to Run in Postman
1. Start the server (`npm start`).
2. Open Postman, click **Import**, and select `postman/RoboRoom-Club.postman_collection.json`.
3. Right click the imported collection and select **Run collection**.
4. Click **Run RoboRoom Club**. All test scripts will execute and display green checkmarks.

---

## Automated Testing Suite

Built using Node.js built-in testing tools:
- `node:test` (Test runner, suites, lifecycle hooks)
- `node:assert/strict` (Strict assertion library)

### Test Suites
1. `tests/api.test.js` – 25 comprehensive tests covering all CRUD endpoints, search, validation, active loan prevention, and the relational `JOIN` query.
2. `tests/twist.test.js` – 5 dedicated tests verifying the three mandatory twist tests, custom code rejection, and code non-reuse after deletion.

### Executing Tests
```bash
npm test
```

### Actual Test Results
```text
✔ RoboRoom Club API Test Suite (128ms)
✔ Special Twist: Automatic Robot Codes & Immutability (97ms)
ℹ tests 30
ℹ suites 2
ℹ pass 30
ℹ fail 0
ℹ cancelled 0
```

---

## Installation and How to Run

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Jaydeep-Mallick/BDF_Group-assignment.git

# 2. Navigate into project directory
cd RoboRoom-Club

# 3. Install dependencies
npm install

# 4. Start the Express server
npm start
```

### Running Tests
```bash
npm test
```

Server runs on:
`http://localhost:3000`

---

## Screenshot Folder Descriptions

Each team member has an individual screenshot folder containing a dedicated checklist and recommended filenames:

1. **Jaydeep Mallick:** [`Jaydeep_screenshot/`](./Jaydeep_screenshot/README.md) – REST endpoints for robots, builders, loans, and the SQL JOIN endpoint (`01_Get_All_Robots.png` through `11_Loan_Details_JOIN.png`).
2. **C. Jaswanth Kumar:** [`Jaswanth_screenshot/`](./Jaswanth_screenshot/README.md) – Express server startup, route configurations, and database table schemas (`01_Express_Server_Running.png` through `06_Loans_Table.png`).
3. **Rithwik Reddy:** [`Rithwik_screenshot/`](./Rithwik_screenshot/README.md) – Input validation error messages, ID format rejection, and query parameter search (`01_Missing_Robot_Name.png` through `06_Validation_Error_Messages.png`).
4. **G. Sudeshna:** [`Sudeshna_screenshot/`](./Sudeshna_screenshot/README.md) – Twist rule verification: `ROB-0001`, `ROB-0002`, code immutability, and twist test results (`01_First_Robot_ROB0001.png` through `04_Twist_Test_Results.png`).
5. **Bhargava Sai:** [`Bhargava_screenshot/`](./Bhargava_screenshot/README.md) – Postman collection overview, runner execution results, automated test reports, and README documentation (`01_Postman_Collection.png` through `06_README_API_Documentation.png`).

---

## GitHub Collaboration & Branching Instructions

### Collaborative Workflow for Group Members

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Jaydeep-Mallick/BDF_Group-assignment.git
   cd BDF_Group-assignment
   ```

2. **Create a Dedicated Feature Branch:**
   ```bash
   git checkout -b feature/jaswanth-server-db
   git checkout -b feature/jaydeep-rest-endpoints
   git checkout -b feature/rithwik-validation-search
   git checkout -b feature/sudeshna-twist-codes
   git checkout -b feature/bhargava-postman-tests
   ```

3. **Implement Changes & Verify Locally:**
   ```bash
   npm test
   ```

4. **Commit Changes with Descriptive Messages:**
   ```bash
   git add .
   git commit -m "feat(robots): implement automatic sequential code generation"
   ```

5. **Push Feature Branch:**
   ```bash
   git push -u origin feature/<branch-name>
   ```

6. **Create a Pull Request (PR):**
   - Open a PR from `feature/<branch-name>` into `main` on GitHub.
   - Request review from a teammate.
   - Merge into `main` after checks pass.

