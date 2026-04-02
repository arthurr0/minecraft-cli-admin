import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

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
    return 'RUN';
  }

  if (status === 'starting') {
    return 'STR';
  }

  if (status === 'stopping') {
    return 'STP';
  }

  return 'OFF';
}

export interface ServerSidebarProps {
  servers: ServerInfo[];
  selectedName?: string;
}

export const ServerSidebar = React.memo(function ServerSidebar({
  servers,
  selectedName,
}: ServerSidebarProps): React.ReactElement {
  if (servers.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="gray">No servers</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {servers.map((server) => {
        const selected = server.name === selectedName;
        const portLabel = server.config.port ? String(server.config.port) : '-';

        return (
          <Box key={server.name} marginBottom={selected ? 0 : 0}>
            <Text color={selected ? 'cyanBright' : 'gray'}>{selected ? '▶ ' : '  '}</Text>
            <Text color={selected ? 'whiteBright' : 'gray'} bold>{server.name}</Text>
            <Text color="gray"> (</Text>
            <Text color={statusColor(server.status)}>{statusLabel(server.status)}</Text>
            <Text color="gray">:</Text>
            <Text color="gray">{portLabel}</Text>
            <Text color="gray">)</Text>
          </Box>
        );
      })}
    </Box>
  );
});