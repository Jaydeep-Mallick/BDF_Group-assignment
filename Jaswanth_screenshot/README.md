# Screenshot Guide – C. Jaswanth Kumar

**Team Member:** C. Jaswanth Kumar  
**Roll Number:** 252U1R9026  
**Assigned Responsibility:** Server, routes and database

---

## Assigned Responsibilities
Jaswanth handles the foundational architecture:
- Express server configuration, middleware, and route mounting in `server.js`.
- SQLite database connection, schema setup (`database/schema.sql`), foreign key enforcement, and initialization in `database/db.js`.
- HTTP status codes and centralized error handling middleware.

---

## Screenshot Checklist

Capture the following execution screenshots and place them inside `Jaswanth_screenshot/`:

| Filename | Action / View | Description / Expected Result |
| :--- | :--- | :--- |
| `01_Express_Server_Running.png` | Terminal running `npm start` | Console log showing server running on `http://localhost:3000`. |
| `02_Routes_Configuration.png` | Code editor / IDE view | View of `server.js` showing modular routes mounted (`/robots`, `/builders`, `/loans`). |
| `03_Database_Connection.png` | Code editor / IDE view | View of `database/db.js` showing `better-sqlite3` initialization and `PRAGMA foreign_keys = ON`. |
| `04_Builders_Table.png` | SQLite CLI / DB Browser | View showing schema and records of `builders` table (`id`, `name`). |
| `05_Robots_Table.png` | SQLite CLI / DB Browser | View showing schema and records of `robots` table (`id`, `code`, `name`, `kind`). |
| `06_Loans_Table.png` | SQLite CLI / DB Browser | View showing schema and records of `loans` table with foreign key relationships. |

---

## Instructions for Submission
1. Start the server and inspect the database via SQLite CLI or DB Browser for SQLite.
2. Save clear screenshots with the exact filenames indicated above.
3. Commit all captured images to `Jaswanth_screenshot/`.

