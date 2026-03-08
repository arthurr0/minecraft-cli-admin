import type { ServerConfig, ServerTypeConfig } from './config.js';

export type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping';

export interface NetworkStats {
  connections: number;
  rxBytes?: number;
  txBytes?: number;
}

export interface ServerInfo {
  name: string;
  config: ServerConfig;
  typeConfig: ServerTypeConfig;
  status: ServerStatus;
  pid?: number;
  uptime?: string;
  memoryMB?: number;
  cpuPercent?: number;
  network?: NetworkStats;
  portInUse?: boolean;
}

export interface ServerActionResult {
  success: boolean;
  message: string;
  error?: string;
}
