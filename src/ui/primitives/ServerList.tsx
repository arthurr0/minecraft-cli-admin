import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

export interface ServerListProps {
  servers: ServerInfo[];
  selectedName?: string;
  narrow?: boolean;
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
    return 'RUN';
  }

  if (status === 'starting') {
    return 'BOOT';
  }

  if (status === 'stopping') {
    return 'HALT';
  }

  return 'DOWN';
}

export function ServerList({ servers, selectedName, narrow = false }: ServerListProps): React.ReactElement {
  if (servers.length === 0) {
    return <Text color="gray">No servers configured.</Text>;
  }

  return (
    <Box flexDirection="column">
      {!narrow ? (
        <Text color="gray" bold>
          {'  NAME'.padEnd(24)}
          {'STATUS'.padEnd(10)}
          {'PORT'.padEnd(8)}
          UPTIME
        </Text>
      ) : null}
      <Text color="gray">{'-'.repeat(narrow ? 42 : 64)}</Text>
      {servers.map((server) => {
        const selected = server.name === selectedName;
        const portLabel = server.config.port ? String(server.config.port) : '-';

        if (narrow) {
          return (
            <Box key={server.name} flexDirection="column" marginBottom={1}>
              <Text color={selected ? 'black' : 'white'} inverse={selected} bold={selected}>
                {selected ? '▶ ' : '  '}
                {server.name}
              </Text>
              <Text color={statusColor(server.status)}>
                {'   '}
                {statusLabel(server.status)}
              </Text>
              <Text color="gray">   {server.config.type}  port:{portLabel}</Text>
            </Box>
          );
        }

        return (
          <Text key={server.name} color={selected ? 'black' : 'white'} inverse={selected} bold={selected}>
            {selected ? '▶ ' : '  '}
            {server.name.padEnd(22)}
            <Text color={statusColor(server.status)}>{statusLabel(server.status).padEnd(10)}</Text>
            <Text color={server.portInUse ? 'greenBright' : 'gray'}>{portLabel.padEnd(8)}</Text>
            <Text color="gray">{server.uptime ?? '-'}</Text>
          </Text>
        );
      })}
    </Box>
  );
}
