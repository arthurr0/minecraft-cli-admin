import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { accessSync, constants } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_BASE_PATH = '/opt/minecraft';
export const FALLBACK_BASE_PATH = process.cwd();

function getBasePath(): string {
  if (process.env.MC_BASE_PATH) {
    return process.env.MC_BASE_PATH;
  }

  try {
    accessSync(DEFAULT_BASE_PATH, constants.W_OK);
    return DEFAULT_BASE_PATH;
  } catch {
    return FALLBACK_BASE_PATH;
  }
}

export function getConfigPath(): string {
  if (process.env.MC_CONFIG_PATH) {
    return process.env.MC_CONFIG_PATH;
  }
  return join(getBasePath(), 'config.json');
}

export function getBackupPath(): string {
  if (process.env.MC_BACKUP_PATH) {
    return process.env.MC_BACKUP_PATH;
  }
  return join(getBasePath(), 'backups');
}

export function getServerLogsPath(serverPath: string): string {
  return join(serverPath, 'logs');
}

export function getLatestLogPath(serverPath: string): string {
  return join(serverPath, 'logs', 'latest.log');
}

export function getServerPropertiesPath(serverPath: string): string {
  return join(serverPath, 'server.properties');
}
