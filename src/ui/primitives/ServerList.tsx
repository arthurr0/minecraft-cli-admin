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

function formatMemory(memoryMB?: number): string {
  return memoryMB === undefined ? '--' : `${memoryMB} MB`;
}

function formatCpu(cpuPercent?: number): string {
  return cpuPercent === undefined ? '--' : `${cpuPercent}%`;
}

function formatTraffic(bytes?: number): string {
  if (bytes === undefined) {
    return '--';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatConnections(server: ServerInfo): string {
  const connections = server.network?.establishedConnections ?? server.network?.connections;
  return connections === undefined ? '--' : `${connections} live`;
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

export function ServerList({ servers, selectedName, columns = 1 }: ServerListProps): React.ReactElement {
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
            const trafficLabel = server.network
              ? `${formatTraffic(server.network.rxBytes)} down / ${formatTraffic(server.network.txBytes)} up`
              : '--';

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
                      <Text>{server.uptime ?? '--'}</Text>
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
                      <Text color="gray">  |  </Text>
                      <Text color={server.network ? 'cyanBright' : 'gray'}>{trafficLabel}</Text>
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
}
