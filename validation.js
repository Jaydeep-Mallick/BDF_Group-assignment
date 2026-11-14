/**
 * RoboRoom Club – Validation Module
 * Contribution: Rithwik Reddy (Roll No: 252U1R9059)
 *
 * Implements input validation and sanitization for robots, builders, loans, and ID parameters.
 */

/**
 * Validates route ID parameters.
 * Must be a positive integer greater than 0.
 * @param {any} value - The ID parameter from req.params.
 * @param {string} [resourceName='ID'] - Human-readable label for error message.
 * @returns {{ valid: boolean, error?: string, id?: number }}
 */
function validateId(value, resourceName = 'ID') {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${resourceName} is required` };
  }

  const str = String(value).trim();
  if (!/^\d+$/.test(str)) {
    return { valid: false, error: `Invalid ${resourceName.toLowerCase()} format` };
  }

  const num = Number(str);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return { valid: false, error: `${resourceName} must be a positive integer` };
  }

  return { valid: true, id: num };
}

/**
 * Validates robot input payload for creation and updates.
 * - name: required non-empty string, trimmed
 * - kind: required non-empty string, trimmed
 * - ignores any client-supplied 'code' field (twist rule)
 * @param {object} body - Request body
 * @returns {{ valid: boolean, error?: string, data?: { name: string, kind: string } }}
 */
function validateRobotInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { name, kind } = body;

  // Validate Robot Name
  if (name === undefined || name === null) {
    return { valid: false, error: 'Robot name is required' };
  }
  if (typeof name !== 'string') {
    return { valid: false, error: 'Robot name must be a string' };
  }
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return { valid: false, error: 'Robot name cannot be empty or whitespace only' };
  }
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Robot name cannot exceed 100 characters' };
  }

  // Validate Robot Kind
  if (kind === undefined || kind === null) {
    return { valid: false, error: 'Robot kind is required' };
  }
  if (typeof kind !== 'string') {
    return { valid: false, error: 'Robot kind must be a string' };
  }
  const trimmedKind = kind.trim();
  if (trimmedKind.length === 0) {
    return { valid: false, error: 'Robot kind cannot be empty or whitespace only' };
  }
  if (trimmedKind.length > 100) {
    return { valid: false, error: 'Robot kind cannot exceed 100 characters' };
  }

  return {
    valid: true,
    data: {
      name: trimmedName,
      kind: trimmedKind
    }
  };
}

/**
 * Validates builder input payload.
 * - name: required non-empty string, trimmed
 * @param {object} body - Request body
 * @returns {{ valid: boolean, error?: string, data?: { name: string } }}
 */
function validateBuilderInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { name } = body;

  if (name === undefined || name === null) {
    return { valid: false, error: 'Builder name is required' };
  }
  if (typeof name !== 'string') {
    return { valid: false, error: 'Builder name must be a string' };
  }
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return { valid: false, error: 'Builder name cannot be empty or whitespace only' };
  }
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Builder name cannot exceed 100 characters' };
  }

  return {
    valid: true,
    data: {
      name: trimmedName
    }
  };
}

/**
 * Validates loan input payload.
 * - builder_id: required positive integer
 * - robot_id: required positive integer
 * @param {object} body - Request body
 * @returns {{ valid: boolean, error?: string, data?: { builder_id: number, robot_id: number } }}
 */
function validateLoanInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { builder_id, robot_id } = body;

  if (builder_id === undefined || builder_id === null) {
    return { valid: false, error: 'builder_id is required' };
  }
  const bCheck = validateId(builder_id, 'Builder ID');
  if (!bCheck.valid) {
    return { valid: false, error: bCheck.error };
  }

  if (robot_id === undefined || robot_id === null) {
    return { valid: false, error: 'robot_id is required' };
  }
  const rCheck = validateId(robot_id, 'Robot ID');
  if (!rCheck.valid) {
    return { valid: false, error: rCheck.error };
  }

  return {
    valid: true,
    data: {
      builder_id: bCheck.id,
      robot_id: rCheck.id
    }
  };
}

module.exports = {
  validateId,
  validateRobotInput,
  validateBuilderInput,
  validateLoanInput
};

