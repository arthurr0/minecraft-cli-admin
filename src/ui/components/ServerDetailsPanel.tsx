import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';
import { createMeter } from '../utils/meter.js';

interface ServerDetailsPanelProps {
  server?: ServerInfo;
  isProcessing?: boolean;
  compact?: boolean;
}

function kv(label: string, value: string, color: string = 'white') {
  return (
    <Box justifyContent="space-between">
      <Text color="gray">{label.padEnd(12)}</Text>
      <Text color={color}>{value}</Text>
    </Box>
  );
}

export const ServerDetailsPanel: React.FC<ServerDetailsPanelProps> = ({
  server,
  isProcessing = false,
  compact = false,
}) => {
  if (!server) {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1}>
        <Text color="cyan" bold>INSTANCE PROFILE</Text>
        <Box marginTop={1}>
          <Text color="gray">NO INSTANCE SELECTED</Text>
        </Box>
      </Box>
    );
  }

  const statusColor =
    server.status === 'running' ? 'greenBright' :
    server.status === 'starting' ? 'yellowBright' :
    server.status === 'stopping' ? 'yellow' :
    'redBright';

  const cpuMeter = createMeter(server.cpuPercent, 100, compact ? 8 : 10);
  const memMeter = createMeter(server.memoryMB, 8192, compact ? 8 : 10);

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text color="cyan" bold>INSTANCE PROFILE</Text>
        <Text color={isProcessing ? 'yellowBright' : 'greenBright'}>
          {isProcessing ? 'BUSY' : 'READY'}
        </Text>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Text color="yellowBright" bold>IDENTITY</Text>
        <Box marginTop={1} flexDirection="column">
          {kv('name', server.name, 'whiteBright')}
          {kv('status', server.status.toUpperCase(), statusColor)}
          {kv('profile', server.config.type)}
          {kv('port', server.config.port ? String(server.config.port) : '-', server.portInUse ? 'greenBright' : 'gray')}
          {kv('pid', server.pid ? String(server.pid) : '-')}
          {kv('uptime', server.uptime ?? '-')}
        </Box>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Text color="greenBright" bold>RESOURCES</Text>
        <Box marginTop={1} flexDirection="column">
          {kv('memory', `${memMeter} ${server.memoryMB === undefined ? '---' : `${server.memoryMB}MB`}`, 'green')}
          {kv('cpu', `${cpuMeter} ${server.cpuPercent === undefined ? '--%' : `${server.cpuPercent}%`}`, 'cyan')}
        </Box>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Text color="blueBright" bold>NETWORK</Text>
        <Box marginTop={1} flexDirection="column">
          {kv('connections', server.network ? String(server.network.connections) : '-')}
          {kv('tcp', server.network ? String(server.network.tcpConnections) : '-')}
          {kv('udp', server.network ? String(server.network.udpSockets) : '-')}
          {kv('listen', server.network ? String(server.network.listeningSockets) : '-')}
          {kv('established', server.network ? String(server.network.establishedConnections) : '-')}
          {kv('rx', server.network?.rxBytes !== undefined ? `${Math.round(server.network.rxBytes / 1024)}KB` : '-')}
          {kv('tx', server.network?.txBytes !== undefined ? `${Math.round(server.network.txBytes / 1024)}KB` : '-')}
        </Box>
      </Box>
    </Box>
  );
};
