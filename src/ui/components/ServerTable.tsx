import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

interface ServerTableProps {
  servers: ServerInfo[];
  selectedIndex: number;
  isLoading: boolean;
  error?: string | null;
  compact?: boolean;
  narrow?: boolean;
}

export const ServerTable: React.FC<ServerTableProps> = ({
  servers,
  selectedIndex,
  isLoading,
  error,
  compact = false,
  narrow = false,
}) => {
  if (isLoading && servers.length === 0) {
    return (
      <Box borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text color="yellow">Loading servers...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderStyle="round" borderColor="red" paddingX={1}>
        <Text color="red">Failed to load server status: {error}</Text>
      </Box>
    );
  }

  if (servers.length === 0) {
    return (
      <Box borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text color="yellow">No servers configured.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1}>
      <Box>
        <Text bold color="green">Fleet Overview</Text>
      </Box>
      <Box marginTop={1}>
        {narrow ? (
          <Text bold color="gray">
            {'  '}
            {'SERVER'.padEnd(14)}
            {'STATE'.padEnd(10)}
          </Text>
        ) : compact ? (
          <Text bold color="gray">
            {'  '}
            {'SERVER'.padEnd(14)}
            {'STATE'.padEnd(10)}
            {'RAM'.padEnd(10)}
            {'CPU'.padEnd(8)}
          </Text>
        ) : (
          <Text bold color="gray">
            {'  '}
            {'SERVER'.padEnd(14)}
            {'STATE'.padEnd(10)}
            {'TYPE'.padEnd(16)}
            {'PORT'.padEnd(8)}
            {'RAM'.padEnd(10)}
            {'UPTIME'.padEnd(12)}
          </Text>
        )}
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">{'─'.repeat(narrow ? 28 : compact ? 44 : 74)}</Text>
      </Box>

      {servers.map((server, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? '> ' : '  ';

        const statusColor = server.status === 'running' ? 'green' : 'red';
        const status = server.status.toUpperCase().padEnd(10);
        const type = server.config.type.padEnd(16);
        const port = (server.config.port?.toString() || '-').padEnd(8);
        const ram = server.memoryMB ? `${server.memoryMB}MB`.padEnd(10) : '-'.padEnd(10);
        const cpu = server.cpuPercent !== undefined ? `${server.cpuPercent}%`.padEnd(8) : '-'.padEnd(8);
        const uptime = (server.uptime || '-').padEnd(12);

        return (
          <Box key={server.name} flexDirection={narrow ? 'column' : 'row'} marginBottom={narrow ? 1 : 0}>
            <Box>
              <Text color={isSelected ? 'cyan' : undefined} bold={isSelected} inverse={isSelected}>
                {prefix}
                {server.name.padEnd(14)}
              </Text>
              <Text color={statusColor}>{status}</Text>
              {!narrow && compact && <Text color="gray">{ram}</Text>}
              {!narrow && compact && <Text color="gray">{cpu}</Text>}
              {!narrow && !compact && <Text color="gray">{type}</Text>}
              {!narrow && !compact && <Text color={server.portInUse ? 'green' : 'gray'}>{port}</Text>}
              {!narrow && !compact && <Text color="gray">{ram}</Text>}
              {!narrow && !compact && <Text color="gray">{uptime}</Text>}
            </Box>
            {narrow && (
              <Box marginLeft={2} flexDirection="column">
                <Text color="gray">Type: {server.config.type}</Text>
                <Text color="gray">RAM: {server.memoryMB ? `${server.memoryMB} MB` : '-'}</Text>
                <Text color="gray">CPU: {server.cpuPercent !== undefined ? `${server.cpuPercent}%` : '-'}</Text>
                <Text color="gray">Port: {server.config.port ?? '-'}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
