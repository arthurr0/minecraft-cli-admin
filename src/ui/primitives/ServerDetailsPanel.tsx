import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

function formatUptime(uptime?: string): string {
  if (!uptime) {
    return '--';
  }

  const dayMatch = uptime.match(/^(\d+)d\s+(\d{2}):(\d{2}):\d{2}$/);
  if (dayMatch) {
    const days = dayMatch[1];
    const hours = Number(dayMatch[2]);
    const minutes = Number(dayMatch[3]);
    return minutes === 0 ? `${days}d ${hours}h` : `${days}d ${hours}h ${minutes}m`;
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

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatMemory(memoryMB?: number): string {
  if (memoryMB === undefined) {
    return '--';
  }

  if (memoryMB >= 1024) {
    return `${(memoryMB / 1024).toFixed(1)} GB`;
  }

  const rounded = Math.round(memoryMB / 16) * 16;
  return `${rounded} MB`;
}

function formatCpu(cpuPercent?: number): string {
  return cpuPercent === undefined ? '--' : `${Math.round(cpuPercent)}%`;
}

function formatConnections(server: ServerInfo): string {
  const connections = server.network?.establishedConnections ?? server.network?.connections;
  return connections === undefined ? '--' : `${connections}`;
}

function formatSockets(server: ServerInfo): string {
  if (!server.network) {
    return '--';
  }

  return `${server.network.listeningSockets}`;
}

export interface ServerDetailsPanelProps {
  server?: ServerInfo;
}

export const ServerDetailsPanel = React.memo(function ServerDetailsPanel({
  server,
}: ServerDetailsPanelProps): React.ReactElement {
  if (!server) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="gray">No server selected</Text>
      </Box>
    );
  }

  const portLabel = server.config.port ? String(server.config.port) : '-';

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="whiteBright" bold>{server.name}</Text>
        <Text color="gray"> (</Text>
        <Text color="yellowBright">{server.config.type}</Text>
        <Text color="gray"> | port </Text>
        <Text>{portLabel}</Text>
        <Text color="gray">)</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text color="gray">Status: </Text>
          <Text color={
            server.status === 'running' ? 'greenBright' :
            server.status === 'starting' ? 'yellowBright' :
            server.status === 'stopping' ? 'yellow' : 'redBright'
          } bold>
            {server.status.toUpperCase()}
          </Text>
        </Text>
        <Text>
          <Text color="gray">Uptime: </Text>
          <Text>{formatUptime(server.uptime)}</Text>
        </Text>
        <Text>
          <Text color="gray">PID: </Text>
          <Text>{server.pid ? String(server.pid) : '--'}</Text>
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text color="gray">Memory: </Text>
          <Text color="yellowBright">{formatMemory(server.memoryMB)}</Text>
        </Text>
        <Text>
          <Text color="gray">CPU: </Text>
          <Text color="yellowBright">{formatCpu(server.cpuPercent)}</Text>
        </Text>
      </Box>

      <Box flexDirection="column">
        <Text>
          <Text color="gray">Connections: </Text>
          <Text>{formatConnections(server)}</Text>
        </Text>
        <Text>
          <Text color="gray">Sockets: </Text>
          <Text>{formatSockets(server)}</Text>
        </Text>
      </Box>
    </Box>
  );
});