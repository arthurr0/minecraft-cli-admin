import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

export interface ServerListProps {
  servers: ServerInfo[];
  selectedName?: string;
  columns?: number;
}

function statusColor(status: ServerInfo['status']): 'greenBright' | 'yellowBright' | 'yellow' | 'redBright' {
  if (status === 'running') {
    return 'greenBright';
  }

  if (status === 'starting') {
    return 'yellowBright';
  }

  if (status === 'stopping') {
    return 'yellow';
  }

  return 'redBright';
}

function statusLabel(status: ServerInfo['status']): string {
  if (status === 'running') {
    return 'RUNNING';
  }

  if (status === 'starting') {
    return 'STARTING';
  }

  if (status === 'stopping') {
    return 'STOPPING';
  }

  return 'STOPPED';
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

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
  return connections === undefined ? '--' : `${connections} live`;
}

function formatSockets(server: ServerInfo): string {
  if (!server.network) {
    return '--';
  }

  return `${server.network.listeningSockets} listen`;
}

function cardWidth(columns: number): string {
  if (columns === 1) {
    return '100%';
  }

  if (columns === 2) {
    return '50%';
  }

  return '33%';
}

export const ServerList = React.memo(function ServerList({
  servers,
  selectedName,
  columns = 1,
}: ServerListProps): React.ReactElement {
  if (servers.length === 0) {
    return <Text color="gray">No servers configured.</Text>;
  }

  const safeColumns = Math.max(1, columns);
  const rows = chunk(servers, safeColumns);

  return (
    <Box flexDirection="column">
      {rows.map((row, rowIndex) => (
        <Box key={`server-row-${rowIndex}`} flexDirection="row" marginBottom={rowIndex < rows.length - 1 ? 1 : 0}>
          {row.map((server, columnIndex) => {
            const selected = server.name === selectedName;
            const portLabel = server.config.port ? String(server.config.port) : '-';
            const borderColor = selected ? 'cyanBright' : statusColor(server.status);

            return (
              <Box
                key={server.name}
                width={cardWidth(safeColumns)}
                paddingRight={columnIndex < row.length - 1 ? 1 : 0}
              >
                <Box
                  flexDirection="column"
                  borderStyle={selected ? 'doubleSingle' : 'round'}
                  borderColor={borderColor}
                  paddingX={1}
                >
                  <Box justifyContent="space-between">
                    <Text color={selected ? 'cyanBright' : 'gray'} bold>{selected ? 'ACTIVE TILE' : 'SERVER TILE'}</Text>
                    <Text color={statusColor(server.status)} bold>{statusLabel(server.status)}</Text>
                  </Box>

                  <Box flexDirection="column" marginTop={1}>
                    <Text color="whiteBright" bold wrap="truncate-end">{server.name}</Text>
                    <Text color="gray" wrap="truncate-end">
                      {server.config.type}
                      <Text color="gray">  |  </Text>
                      port {portLabel}
                      <Text color="gray">  |  </Text>
                      xmx {server.typeConfig.memory}
                    </Text>
                  </Box>

                  <Box flexDirection="column" marginTop={1}>
                    <Text wrap="truncate-end">
                      <Text color="gray">uptime </Text>
                      <Text>{formatUptime(server.uptime)}</Text>
                      <Text color="gray">  |  pid </Text>
                      <Text>{server.pid ? String(server.pid) : '--'}</Text>
                    </Text>
                    <Text wrap="truncate-end">
                      <Text color="gray">memory </Text>
                      <Text color="cyanBright">{formatMemory(server.memoryMB)}</Text>
                      <Text color="gray">  |  cpu </Text>
                      <Text color="cyanBright">{formatCpu(server.cpuPercent)}</Text>
                    </Text>
                    <Text wrap="truncate-end">
                      <Text color="gray">connections </Text>
                      <Text>{formatConnections(server)}</Text>
                      <Text color="gray">  |  sockets </Text>
                      <Text color={server.network ? 'cyanBright' : 'gray'}>{formatSockets(server)}</Text>
                    </Text>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
});
