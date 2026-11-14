/**
 * RoboRoom Club – Twist Automated Test Suite
 * Contribution: G. Sudeshna (Roll No: 252U1R9039)
 * Contribution: Bhargava Sai (Roll No: 252U1R9055)
 *
 * Dedicated tests for the Automatic Robot Codes Special Twist:
 * - Verifies initial database contains at least four default robots (ROB-0001 through ROB-0004)
 * - Verifies sequential unique code generation for newly created robots (e.g. ROB-0005, ROB-0006)
 * - Verifies code immutability during update (PUT /robots/:id cannot modify code)
 * - Verifies client cannot specify custom codes on creation
 * - Verifies deleting a robot never causes its code to be reused
 *
 * Runs against an isolated test database to ensure zero interference from dev data.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const twistDbPath = path.join(__dirname, 'twist_test.db');
process.env.DB_PATH = twistDbPath;

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

describe('Special Twist: Automatic Robot Codes & Immutability', () => {
  before(async () => {
    // Clean up any old twist database files
    [twistDbPath, `${twistDbPath}-wal`, `${twistDbPath}-shm`].forEach((file) => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (_) {}
      }
    });

    // Initialize fresh isolated twist test database
    initDb(twistDbPath);

    // Start server on dynamic port
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

    [twistDbPath, `${twistDbPath}-wal`, `${twistDbPath}-shm`].forEach((file) => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (_) {}
      }
    });
  });

  let firstRobotId;
  let secondRobotId;
  let createdRobotId1;
  let createdRobotId2;

  // 1. Initial Database Robot Verification
  it('1. Initial database contains at least four default robots (ROB-0001 through ROB-0004)', async () => {
    const res = await apiRequest('/robots');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 4, 'Database must contain at least 4 robots by default');

    const r1 = res.body.find((r) => r.code === 'ROB-0001');
    const r2 = res.body.find((r) => r.code === 'ROB-0002');
    const r3 = res.body.find((r) => r.code === 'ROB-0003');
    const r4 = res.body.find((r) => r.code === 'ROB-0004');

    assert.ok(r1, 'Robot with code ROB-0001 must exist');
    assert.equal(r1.name, 'Robo Alpha');
    assert.equal(r1.kind, 'Humanoid');
    firstRobotId = r1.id;

    assert.ok(r2, 'Robot with code ROB-0002 must exist');
    assert.equal(r2.name, 'Robo Beta');
    assert.equal(r2.kind, 'Wheeled');
    secondRobotId = r2.id;

    assert.ok(r3, 'Robot with code ROB-0003 must exist');
    assert.equal(r3.name, 'Robo Gamma');
    assert.equal(r3.kind, 'Industrial');

    assert.ok(r4, 'Robot with code ROB-0004 must exist');
    assert.equal(r4.name, 'Robo Delta');
    assert.equal(r4.kind, 'Autonomous');
  });

  // 2. Sequential Code Generation for New Robots
  it('2. Creating new robots generates the next sequential unique codes (ROB-0005, ROB-0006)', async () => {
    const res1 = await apiRequest('/robots', {
      method: 'POST',
      body: { name: 'Robo Epsilon', kind: 'Drone' }
    });

    assert.equal(res1.status, 201, 'Status must be 201 Created');
    assert.ok(res1.body.id);
    assert.equal(res1.body.code, 'ROB-0005', 'Next robot must receive sequential code ROB-0005');
    assert.equal(res1.body.name, 'Robo Epsilon');
    createdRobotId1 = res1.body.id;

    const res2 = await apiRequest('/robots', {
      method: 'POST',
      body: { name: 'Robo Zeta', kind: 'Android' }
    });

    assert.equal(res2.status, 201, 'Status must be 201 Created');
    assert.ok(res2.body.id);
    assert.equal(res2.body.code, 'ROB-0006', 'Subsequent robot must receive sequential code ROB-0006');
    assert.equal(res2.body.name, 'Robo Zeta');
    createdRobotId2 = res2.body.id;
  });

  // 3. Code Immutability on Update
  it('3. Updating robot while attempting to change code -> HTTP 200, code remains unchanged', async () => {
    const updatePayload = {
      name: 'Updated Robo Alpha',
      kind: 'Humanoid',
      code: 'ROB-9999' // Client attempts to modify code
    };

    const res = await apiRequest(`/robots/${firstRobotId}`, {
      method: 'PUT',
      body: updatePayload
    });

    assert.equal(res.status, 200, 'Status must be 200 OK');
    assert.equal(res.body.id, firstRobotId);
    assert.equal(res.body.name, 'Updated Robo Alpha', 'Robot name must update');
    assert.equal(res.body.kind, 'Humanoid', 'Robot kind must update');
    assert.equal(res.body.code, 'ROB-0001', 'Robot code must remain ROB-0001; client cannot modify code');

    // Verify in database via GET /robots/:id
    const verifyRes = await apiRequest(`/robots/${firstRobotId}`);
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.code, 'ROB-0001', 'Code in database must remain ROB-0001');
    assert.equal(verifyRes.body.name, 'Updated Robo Alpha');
  });

  // 4. Client Cannot Override Code on Creation
  it('4. Client cannot override code during creation: server assigns next sequential code', async () => {
    const res = await apiRequest('/robots', {
      method: 'POST',
      body: {
        name: 'Robo Eta',
        kind: 'Aerial',
        code: 'CUSTOM-7777' // Client attempts to specify code
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.code, 'ROB-0007', 'Server must ignore client code and assign ROB-0007');
  });

  // 5. Deleted Codes Are Never Reused
  it('5. Deleted robot codes are NOT reused: deleting a robot does not roll back the sequence', async () => {
    // Delete robot ROB-0006
    const delRes = await apiRequest(`/robots/${createdRobotId2}`, {
      method: 'DELETE'
    });
    assert.equal(delRes.status, 204);

    // Create a new robot
    const newRes = await apiRequest('/robots', {
      method: 'POST',
      body: {
        name: 'Robo Theta',
        kind: 'Submersible'
      }
    });

    assert.equal(newRes.status, 201);
    assert.equal(newRes.body.code, 'ROB-0008', 'Next robot must receive ROB-0008, NOT reuse deleted ROB-0006');
  });
});
