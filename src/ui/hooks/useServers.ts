import { useState, useEffect, useCallback, useRef } from 'react';
import { serverService } from '../../services/index.js';
import type { ServerInfo } from '../../types/server.js';

interface ServersState {
  servers: ServerInfo[];
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function uptimeFingerprint(uptime?: string): string {
  if (!uptime) {
    return '--';
  }

  const dayMatch = uptime.match(/^(\d+)d\s+(\d{2}):(\d{2}):\d{2}$/);
  if (dayMatch) {
    return `${dayMatch[1]}d-${dayMatch[2]}h-${dayMatch[3]}m`;
  }

  const timeMatch = uptime.match(/^(\d{2}):(\d{2}):\d{2}$/);
  if (!timeMatch) {
    return uptime;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const totalMinutes = (hours * 60) + minutes;

  if (totalMinutes === 0) {
    return '<1m';
  }

  if (hours === 0) {
    return `${totalMinutes}m`;
  }

  return `${hours}h-${String(minutes).padStart(2, '0')}m`;
}

function memoryFingerprint(memoryMB?: number): string {
  if (memoryMB === undefined) {
    return '--';
  }

  if (memoryMB >= 1024) {
    return `${(memoryMB / 1024).toFixed(1)}g`;
  }

  const rounded = Math.round(memoryMB / 16) * 16;
  return `${rounded}m`;
}

function cpuFingerprint(cpuPercent?: number): string {
  return cpuPercent === undefined ? '--' : `${Math.round(cpuPercent)}%`;
}

function networkFingerprint(server: ServerInfo): string {
  if (!server.network) {
    return '--';
  }

  return [
    server.network.establishedConnections ?? server.network.connections,
    server.network.listeningSockets,
    server.network.tcpConnections,
    server.network.udpSockets,
  ].join('/');
}

function createServerFingerprint(servers: ServerInfo[]): string {
  return servers
    .map((server) => [
      server.name,
      server.status,
      server.config.type,
      server.config.port ?? '-',
      server.portInUse ? '1' : '0',
      server.pid ?? '-',
      uptimeFingerprint(server.uptime),
      memoryFingerprint(server.memoryMB),
      cpuFingerprint(server.cpuPercent),
      networkFingerprint(server),
    ].join('|'))
    .join('||');
}

export function useServers(pollInterval: number = 2000) {
  const [state, setState] = useState<ServersState>({
    servers: [],
    isLoading: true,
    error: null,
    lastUpdated: undefined,
  });
  const lastFingerprintRef = useRef<string>('');

  const refresh = useCallback(async () => {
    try {
      const status = await serverService.getAllStatus();
      const nextFingerprint = createServerFingerprint(status);
      const hasChanged = nextFingerprint !== lastFingerprintRef.current;

      if (hasChanged) {
        lastFingerprintRef.current = nextFingerprint;
      }

      setState((current) => {
        if (!hasChanged && current.error === null && current.isLoading === false) {
          return current;
        }

        return {
          servers: hasChanged ? status : current.servers,
          error: null,
          isLoading: false,
          lastUpdated: hasChanged ? timestamp() : current.lastUpdated ?? timestamp(),
        };
      });
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Unknown error';

      setState((current) => {
        if (current.error === nextError && current.isLoading === false) {
          return current;
        }

        return {
          ...current,
          error: nextError,
          isLoading: false,
        };
      });
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [refresh, pollInterval]);

  return { ...state, refresh };
}
