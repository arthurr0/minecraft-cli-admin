import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

export interface ServerDetailsProps {
  server?: ServerInfo;
  processing: boolean;
}

function line(label: string, value: string, color: 'gray' | 'white' | 'greenBright' | 'redBright' | 'yellowBright' | 'cyanBright' = 'white'): React.ReactElement {
  return (
    <Box justifyContent="space-between">
      <Text color="gray">{label.padEnd(12)}</Text>
      <Text color={color}>{value}</Text>
    </Box>
  );
}

function serverStatusColor(status: ServerInfo['status']): 'greenBright' | 'yellowBright' | 'redBright' {
  if (status === 'running') {
    return 'greenBright';
  }

  if (status === 'starting' || status === 'stopping') {
    return 'yellowBright';
  }

  return 'redBright';
}

export function ServerDetails({ server, processing }: ServerDetailsProps): React.ReactElement {
  if (!server) {
    return <Text color="gray">No server selected.</Text>;
  }

  return (
    <Box flexDirection="column">
      {line('mode', processing ? 'processing' : 'ready', processing ? 'yellowBright' : 'greenBright')}
      {line('name', server.name)}
      {line('status', server.status, serverStatusColor(server.status))}
      {line('profile', server.config.type)}
      {line('port', server.config.port ? String(server.config.port) : '-', server.portInUse ? 'greenBright' : 'gray')}
      {line('pid', server.pid ? String(server.pid) : '-')}
      {line('uptime', server.uptime ?? '-')}
      {line('memory', server.memoryMB === undefined ? '-' : `${server.memoryMB} MB`, 'cyanBright')}
      {line('cpu', server.cpuPercent === undefined ? '-' : `${server.cpuPercent}%`, 'cyanBright')}
    </Box>
  );
}
