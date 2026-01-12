import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

interface ServerTableProps {
  servers: ServerInfo[];
  selectedIndex: number;
  isLoading: boolean;
}

export const ServerTable: React.FC<ServerTableProps> = ({ servers, selectedIndex, isLoading }) => {
  if (isLoading && servers.length === 0) {
    return (
      <Box>
        <Text color="yellow">Loading servers...</Text>
      </Box>
    );
  }

  if (servers.length === 0) {
    return (
      <Box>
        <Text color="yellow">No servers configured.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="gray">
          {'  '}
          {'SERVER'.padEnd(16)}
          {'STATUS'.padEnd(10)}
          {'PID'.padEnd(8)}
          {'UPTIME'.padEnd(12)}
          {'RAM'.padEnd(10)}
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">{'─'.repeat(60)}</Text>
      </Box>

      {servers.map((server, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? '> ' : '  ';

        const statusColor = server.status === 'running' ? 'green' : 'red';
        const status = server.status.toUpperCase().padEnd(10);
        const pid = (server.pid?.toString() || '-').padEnd(8);
        const uptime = (server.uptime || '-').padEnd(12);
        const ram = server.memoryMB ? `${server.memoryMB}MB`.padEnd(10) : '-'.padEnd(10);

        return (
          <Box key={server.name}>
            <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
              {prefix}
              {server.name.padEnd(16)}
            </Text>
            <Text color={statusColor}>{status}</Text>
            <Text color="gray">{pid}</Text>
            <Text color="gray">{uptime}</Text>
            <Text color="gray">{ram}</Text>
          </Box>
        );
      })}
    </Box>
  );
};
