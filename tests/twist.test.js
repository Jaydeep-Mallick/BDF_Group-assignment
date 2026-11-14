/**
 * RoboRoom Club – Twist Automated Test Suite
 * Contribution: G. Sudeshna (Roll No: 252U1R9039)
 * Contribution: Bhargava Sai (Roll No: 252U1R9055)
 *
 * Dedicated tests for the Automatic Robot Codes Special Twist:
 * - MANDATORY TEST 1: First robot receives ROB-0001 (HTTP 201)
 * - MANDATORY TEST 2: Second robot receives ROB-0002 (HTTP 201)
 * - MANDATORY TEST 3: Updating robot with a different code leaves code unchanged as ROB-0001 (HTTP 200)
 * - Additional verification: Deleted codes are never reused; clients cannot set custom codes.
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

  // MANDATORY TEST 1
  it('MANDATORY TEST 1: Add the first robot -> HTTP 201, code is ROB-0001', async () => {
    const payload = {
      name: 'Robo Alpha',
      kind: 'Humanoid'
    };

    const res = await apiRequest('/robots', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 201, 'Status must be 201 Created');
    assert.ok(res.body.id, 'Robot must have an ID');
    assert.equal(res.body.code, 'ROB-0001', 'First robot must receive code ROB-0001');
    assert.equal(res.body.name, 'Robo Alpha');
    assert.equal(res.body.kind, 'Humanoid');

    firstRobotId = res.body.id;
  });

  // MANDATORY TEST 2
  it('MANDATORY TEST 2: Add the second robot -> HTTP 201, code is ROB-0002', async () => {
    const payload = {
      name: 'Robo Beta',
      kind: 'Wheeled'
    };

    const res = await apiRequest('/robots', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 201, 'Status must be 201 Created');
    assert.ok(res.body.id, 'Robot must have an ID');
    assert.equal(res.body.code, 'ROB-0002', 'Second robot must receive code ROB-0002');
    assert.equal(res.body.name, 'Robo Beta');
    assert.equal(res.body.kind, 'Wheeled');

    secondRobotId = res.body.id;
  });

  // MANDATORY TEST 3
  it('MANDATORY TEST 3: Update first robot while attempting to change its code -> HTTP 200, code remains ROB-0001', async () => {
    const updatePayload = {
      name: 'Updated Robo Alpha',
      kind: 'Humanoid',
      code: 'ROB-9999' // Attempting to change code
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

    // Double check via GET /robots/:id
    const verifyRes = await apiRequest(`/robots/${firstRobotId}`);
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.code, 'ROB-0001', 'Code in database must remain ROB-0001');
    assert.equal(verifyRes.body.name, 'Updated Robo Alpha');
  });

  // Additional Twist Verification: Client cannot inject custom code on creation
  it('Client cannot override code during creation: server overrides client code with next sequential code', async () => {
    const res = await apiRequest('/robots', {
      method: 'POST',
      body: {
        name: 'Robo Gamma',
        kind: 'Aerial',
        code: 'CUSTOM-7777' // Client attempts to specify code
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.code, 'ROB-0003', 'Server must ignore client code and assign ROB-0003');
  });

  // Additional Twist Verification: Deleted codes are never reused
  it('Deleted robot codes are NOT reused: deleting a robot does not roll back the sequence', async () => {
    // Delete second robot (ROB-0002)
    const delRes = await apiRequest(`/robots/${secondRobotId}`, {
      method: 'DELETE'
    });
    assert.equal(delRes.status, 204);

    // Create a new fourth robot
    const newRes = await apiRequest('/robots', {
      method: 'POST',
      body: {
        name: 'Robo Delta',
        kind: 'Submersible'
      }
    });

    assert.equal(newRes.status, 201);
    assert.equal(newRes.body.code, 'ROB-0004', 'Next robot must receive ROB-0004, NOT reuse deleted ROB-0002');
  });
});

