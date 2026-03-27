import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';
import { createMeter } from '../utils/meter.js';

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
      <Box borderStyle="single" borderColor="yellowBright" paddingX={1}>
        <Text color="yellowBright">Syncing fleet snapshot...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderStyle="single" borderColor="redBright" paddingX={1}>
        <Text color="redBright">Telemetry load failed: {error}</Text>
      </Box>
    );
  }

  if (servers.length === 0) {
    return (
      <Box borderStyle="single" borderColor="yellowBright" paddingX={1}>
        <Text color="yellowBright">No instances registered in config.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="singleDouble" borderColor="greenBright" paddingX={1}>
      <Box>
        <Text bold color="greenBright">Fleet Matrix</Text>
      </Box>
      <Box marginTop={1}>
        {narrow ? (
          <Text bold color="gray">
            {'  '}
            {'INSTANCE'.padEnd(16)}
            {'STATE'.padEnd(12)}
          </Text>
        ) : compact ? (
          <Text bold color="gray">
            {'  '}
            {'INSTANCE'.padEnd(16)}
            {'STATE'.padEnd(12)}
            {'RAM'.padEnd(15)}
            {'CPU'.padEnd(15)}
          </Text>
        ) : (
          <Text bold color="gray">
            {'  '}
            {'INSTANCE'.padEnd(16)}
            {'STATE'.padEnd(12)}
            {'PROFILE'.padEnd(16)}
            {'PORT'.padEnd(8)}
            {'RAM'.padEnd(15)}
            {'CPU'.padEnd(15)}
            {'UPTIME'.padEnd(12)}
          </Text>
        )}
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">{'─'.repeat(narrow ? 32 : compact ? 58 : 92)}</Text>
      </Box>

      {servers.map((server, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? '> ' : '  ';

        const statusColor =
          server.status === 'running' ? 'greenBright' :
          server.status === 'starting' ? 'yellowBright' :
          server.status === 'stopping' ? 'yellow' :
          'redBright';
        const status = server.status.toUpperCase().padEnd(12);
        const type = server.config.type.padEnd(16);
        const port = (server.config.port?.toString() || '-').padEnd(8);
        const ramGauge = createMeter(server.memoryMB, 8192, compact || narrow ? 8 : 10);
        const ramValue = server.memoryMB !== undefined ? `${server.memoryMB}MB` : '-';
        const ram = `${ramGauge} ${ramValue}`.padEnd(15);
        const cpuGauge = createMeter(server.cpuPercent, 100, compact || narrow ? 8 : 10);
        const cpuValue = server.cpuPercent !== undefined ? `${server.cpuPercent}%` : '-';
        const cpu = `${cpuGauge} ${cpuValue}`.padEnd(15);
        const uptime = (server.uptime || '-').padEnd(12);

        return (
          <Box key={server.name} flexDirection={narrow ? 'column' : 'row'} marginBottom={narrow ? 1 : 0}>
            <Box>
              <Text color={isSelected ? 'black' : 'white'} bold={isSelected} inverse={isSelected}>
                {prefix}
                {server.name.padEnd(16)}
              </Text>
              <Text color={statusColor}>{status}</Text>
              {!narrow && compact && <Text color="green">{ram}</Text>}
              {!narrow && compact && <Text color="cyan">{cpu}</Text>}
              {!narrow && !compact && <Text color="gray">{type}</Text>}
              {!narrow && !compact && <Text color={server.portInUse ? 'greenBright' : 'gray'}>{port}</Text>}
              {!narrow && !compact && <Text color="green">{ram}</Text>}
              {!narrow && !compact && <Text color="cyan">{cpu}</Text>}
              {!narrow && !compact && <Text color="gray">{uptime}</Text>}
            </Box>
            {narrow && (
              <Box marginLeft={2} flexDirection="column">
                <Text color="gray">Profile: {server.config.type}</Text>
                <Text color="green">RAM {ramGauge} {ramValue}</Text>
                <Text color="cyan">CPU {cpuGauge} {cpuValue}</Text>
                <Text color={server.portInUse ? 'greenBright' : 'gray'}>Port: {server.config.port ?? '-'}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
