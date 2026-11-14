/**
 * RoboRoom Club – Complete API Automated Test Suite
 * Contribution: Bhargava Sai (Roll No: 252U1R9055)
 *
 * Comprehensive tests covering:
 * - Server health and routes
 * - Full CRUD for Robots, Builders, and Loans
 * - Relational JOIN endpoint (/loans/details)
 * - Validation on creation, updates, and ID parameters
 * - Search by kind and name
 * - Duplicate active loan prevention
 * - Referential integrity conflict protection
 * - Loan return and re-loan lifecycle
 *
 * Runs against an isolated test database (api_test.db).
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const apiDbPath = path.join(__dirname, 'api_test.db');
process.env.DB_PATH = apiDbPath;

const { app } = require('../server');
const { initDb, closeDb } = require('../database/db');

let server;
let baseUrl;

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, body: data };
}

describe('RoboRoom Club API Test Suite', () => {
  before(async () => {
    [apiDbPath, `${apiDbPath}-wal`, `${apiDbPath}-shm`].forEach((file) => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (_) {}
      }
    });

    initDb(apiDbPath);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });

    closeDb();

    [apiDbPath, `${apiDbPath}-wal`, `${apiDbPath}-shm`].forEach((file) => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (_) {}
      }
    });
  });

  // 1. Server Availability
  it('1. Server availability: GET / returns 200 and online status', async () => {
    const res = await apiRequest('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.project, 'RoboRoom Club');
    assert.equal(res.body.status, 'online');
  });

  // 2. Robot Operations
  let testRobotId;
  it('2a. POST /robots creates a new robot with generated code (201)', async () => {
    const res = await apiRequest('/robots', {
      method: 'POST',
      body: { name: 'Titan Mech', kind: 'Humanoid' }
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    assert.ok(res.body.code);
    assert.equal(res.body.name, 'Titan Mech');
    assert.equal(res.body.kind, 'Humanoid');
    testRobotId = res.body.id;
  });

  it('2b. GET /robots returns list of robots (200)', async () => {
    const res = await apiRequest('/robots');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.some((r) => r.id === testRobotId));
  });

  it('2c. GET /robots/:id retrieves single robot by ID (200)', async () => {
    const res = await apiRequest(`/robots/${testRobotId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, testRobotId);
    assert.equal(res.body.name, 'Titan Mech');
  });

  it('2d. PUT /robots/:id updates robot name and kind (200)', async () => {
    const res = await apiRequest(`/robots/${testRobotId}`, {
      method: 'PUT',
      body: { name: 'Titan Mech Prime', kind: 'Heavy Humanoid' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Titan Mech Prime');
    assert.equal(res.body.kind, 'Heavy Humanoid');
  });

  it('2e. DELETE /robots/:id deletes unloaned robot (204)', async () => {
    // Create disposable robot to delete
    const temp = await apiRequest('/robots', {
      method: 'POST',
      body: { name: 'Scout Bot', kind: 'Drone' }
    });
    assert.equal(temp.status, 201);
    const tempId = temp.body.id;

    const delRes = await apiRequest(`/robots/${tempId}`, { method: 'DELETE' });
    assert.equal(delRes.status, 204);

    const check = await apiRequest(`/robots/${tempId}`);
    assert.equal(check.status, 404);
  });

  // 3. Builder Operations
  let testBuilderId;
  it('3a. POST /builders creates a new builder (201)', async () => {
    const res = await apiRequest('/builders', {
      method: 'POST',
      body: { name: 'Jaydeep Mallick' }
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    assert.equal(res.body.name, 'Jaydeep Mallick');
    testBuilderId = res.body.id;
  });

  it('3b. GET /builders returns list of builders (200)', async () => {
    const res = await apiRequest('/builders');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.some((b) => b.id === testBuilderId));
  });

  it('3c. GET /builders/:id retrieves builder by ID (200)', async () => {
    const res = await apiRequest(`/builders/${testBuilderId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, testBuilderId);
    assert.equal(res.body.name, 'Jaydeep Mallick');
  });

  // 4. Loan Operations & JOIN Endpoint
  let testLoanId;
  it('4a. POST /loans creates an active loan (201)', async () => {
    const res = await apiRequest('/loans', {
      method: 'POST',
      body: {
        builder_id: testBuilderId,
        robot_id: testRobotId
      }
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    assert.equal(res.body.builder_id, testBuilderId);
    assert.equal(res.body.robot_id, testRobotId);
    assert.equal(res.body.return_date, null);
    testLoanId = res.body.id;
  });

  it('4b. GET /loans returns all loans (200)', async () => {
    const res = await apiRequest('/loans');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.some((l) => l.id === testLoanId));
  });

  it('4c. GET /loans/:id retrieves loan by ID (200)', async () => {
    const res = await apiRequest(`/loans/${testLoanId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, testLoanId);
    assert.equal(res.body.builder_id, testBuilderId);
  });

  it('4d. MANDATORY JOIN ENDPOINT: GET /loans/details returns builder and robot names', async () => {
    const res = await apiRequest('/loans/details');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));

    const item = res.body.find((l) => l.id === testLoanId);
    assert.ok(item, 'Created loan must appear in joined details');
    assert.equal(item.builder_id, testBuilderId);
    assert.equal(item.builder_name, 'Jaydeep Mallick');
    assert.equal(item.robot_id, testRobotId);
    assert.equal(item.robot_name, 'Titan Mech Prime');
    assert.ok(item.robot_code.startsWith('ROB-'));
    assert.equal(item.return_date, null);
  });

  it('4e. Duplicate active loan prevention: cannot loan an already active robot (409 Conflict)', async () => {
    // Another builder attempts to rent the same active robot
    const builder2 = await apiRequest('/builders', { method: 'POST', body: { name: 'Jaswanth Kumar' } });
    const res = await apiRequest('/loans', {
      method: 'POST',
      body: { builder_id: builder2.body.id, robot_id: testRobotId }
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Robot is currently on loan');
  });

  it('4f. Return loan: POST /loans/:id/return updates return_date (200)', async () => {
    const res = await apiRequest(`/loans/${testLoanId}/return`, { method: 'POST' });
    assert.equal(res.status, 200);
    assert.ok(res.body.return_date !== null);
  });

  it('4g. Duplicate return rejection: returns 409 Conflict if already returned', async () => {
    const res = await apiRequest(`/loans/${testLoanId}/return`, { method: 'POST' });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Loan already returned');
  });

  it('4h. Re-loaning after return: robot can now be loaned again after previous loan returned (201)', async () => {
    const res = await apiRequest('/loans', {
      method: 'POST',
      body: { builder_id: testBuilderId, robot_id: testRobotId }
    });
    assert.equal(res.status, 201);
  });

  // 5. Validation and Error Handling
  it('5a. Validation: rejects empty robot name with 400', async () => {
    const res = await apiRequest('/robots', {
      method: 'POST',
      body: { name: '   ', kind: 'Humanoid' }
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('5b. Validation: rejects missing robot kind with 400', async () => {
    const res = await apiRequest('/robots', {
      method: 'POST',
      body: { name: 'Robo Walker' }
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('5c. Validation: rejects invalid ID format with 400', async () => {
    const r1 = await apiRequest('/robots/abc');
    assert.equal(r1.status, 400);

    const r2 = await apiRequest('/builders/-5');
    assert.equal(r2.status, 400);

    const r3 = await apiRequest('/loans/0');
    assert.equal(r3.status, 400);
  });

  it('5d. Non-existing records return 404', async () => {
    const r1 = await apiRequest('/robots/999999');
    assert.equal(r1.status, 404);
    assert.equal(r1.body.error, 'Robot not found');

    const r2 = await apiRequest('/builders/999999');
    assert.equal(r2.status, 404);
    assert.equal(r2.body.error, 'Builder not found');

    const r3 = await apiRequest('/loans/999999');
    assert.equal(r3.status, 404);
    assert.equal(r3.body.error, 'Loan not found');
  });

  // 6. Search Capabilities
  it('6a. Search robots by kind (case-insensitive query)', async () => {
    const res = await apiRequest('/robots?kind=humanoid');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
    assert.ok(res.body.every((r) => r.kind.toLowerCase().includes('humanoid')));
  });

  it('6b. Search robots by name (case-insensitive query)', async () => {
    const res = await apiRequest('/robots?name=titan');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.some((r) => r.name.toLowerCase().includes('titan')));
  });

  // 7. Referential Integrity
  it('7a. Referential integrity: cannot delete robot with active or past loans (409)', async () => {
    const res = await apiRequest(`/robots/${testRobotId}`, { method: 'DELETE' });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Cannot delete robot with existing loan records');
  });

  it('7b. Referential integrity: cannot delete builder with active or past loans (409)', async () => {
    const res = await apiRequest(`/builders/${testBuilderId}`, { method: 'DELETE' });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Cannot delete builder with active or past loans');
  });
});

