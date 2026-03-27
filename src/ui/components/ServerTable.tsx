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

function statusTone(status: ServerInfo['status']): {
  chip: string;
  color: 'greenBright' | 'yellowBright' | 'redBright' | 'yellow';
} {
  if (status === 'running') {
    return { chip: '[ RUN ]', color: 'greenBright' };
  }

  if (status === 'starting') {
    return { chip: '[ BOOT ]', color: 'yellowBright' };
  }

  if (status === 'stopping') {
    return { chip: '[ HALT ]', color: 'yellow' };
  }

  return { chip: '[ DOWN ]', color: 'redBright' };
}

function lineColor(index: number): 'gray' | 'white' {
  return index % 2 === 0 ? 'gray' : 'white';
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
      <Box borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1}>
        <Text color="yellowBright">LOADING MATRIX SNAPSHOT...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderStyle="doubleSingle" borderColor="redBright" paddingX={1}>
        <Text color="redBright">MATRIX OFFLINE: {error}</Text>
      </Box>
    );
  }

  if (servers.length === 0) {
    return (
      <Box borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1}>
        <Text color="yellowBright">NO INSTANCES REGISTERED</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="doubleSingle" borderColor="greenBright" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="greenBright">FLEET MATRIX</Text>
        <Text color="gray">ARROWS NAVIGATE</Text>
      </Box>

      {!narrow && (
        <Box marginTop={1}>
          <Text color="gray" bold>
            {'  '}
            {'INSTANCE'.padEnd(compact ? 18 : 20)}
            {'STATE'.padEnd(9)}
            {'PORT'.padEnd(8)}
            {'MEMORY'.padEnd(19)}
            {'CPU'.padEnd(19)}
            {!compact && 'UPTIME'}
          </Text>
        </Box>
      )}

      <Box>
        <Text color="gray">{'─'.repeat(narrow ? 42 : compact ? 78 : 92)}</Text>
      </Box>

      {servers.map((server, index) => {
        const selected = index === selectedIndex;
        const prefix = selected ? '▶' : '•';

        const status = statusTone(server.status);
        const memMeter = createMeter(server.memoryMB, 8192, compact || narrow ? 8 : 10);
        const cpuMeter = createMeter(server.cpuPercent, 100, compact || narrow ? 8 : 10);
        const memValue = server.memoryMB === undefined ? '---' : `${server.memoryMB}M`;
        const cpuValue = server.cpuPercent === undefined ? '--%' : `${server.cpuPercent}%`;

        if (narrow) {
          return (
            <Box key={server.name} flexDirection="column" marginBottom={1}>
              <Text color={selected ? 'black' : lineColor(index)} inverse={selected} bold={selected}>
                {prefix} {server.name}
              </Text>
              <Text color={status.color}>   {status.chip}  PROFILE {server.config.type}</Text>
              <Text color="green">   MEM {memMeter} {memValue}</Text>
              <Text color="cyan">   CPU {cpuMeter} {cpuValue}</Text>
              <Text color={server.portInUse ? 'greenBright' : 'gray'}>
                {'   '}PORT {server.config.port ?? '-'}
              </Text>
            </Box>
          );
        }

        return (
          <Box key={server.name}>
            <Text color={selected ? 'black' : lineColor(index)} inverse={selected} bold={selected}>
              {selected ? '▶ ' : '  '}
              {server.name.padEnd(compact ? 18 : 20)}
            </Text>

            <Text color={status.color}>{status.chip.padEnd(9)}</Text>

            <Text color={server.portInUse ? 'greenBright' : 'gray'}>
              {(server.config.port ? String(server.config.port) : '-').padEnd(8)}
            </Text>

            <Text color="green">
              {`${memMeter} ${memValue}`.padEnd(19)}
            </Text>

            <Text color="cyan">
              {`${cpuMeter} ${cpuValue}`.padEnd(19)}
            </Text>

            {!compact && <Text color="gray">{server.uptime ?? '-'}</Text>}
          </Box>
        );
      })}
    </Box>
  );
};
