const SERVER_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_SERVER_NAME_LENGTH = 32;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateServerName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Server name cannot be empty' };
  }

  if (name.length > MAX_SERVER_NAME_LENGTH) {
    return { valid: false, error: `Server name is too long (max ${MAX_SERVER_NAME_LENGTH} characters)` };
  }

  if (!SERVER_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      error: 'Server name contains invalid characters. Only letters, numbers, hyphens and underscores are allowed'
    };
  }

  return { valid: true };
}

export function validatePort(port: number): ValidationResult {
  if (!Number.isInteger(port)) {
    return { valid: false, error: 'Port must be an integer' };
  }

  if (port < 1 || port > 65535) {
    return { valid: false, error: 'Port must be between 1 and 65535' };
  }

  return { valid: true };
}
