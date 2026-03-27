import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';
import { createMeter } from '../utils/meter.js';

interface ServerDetailsPanelProps {
  server?: ServerInfo;
  isProcessing?: boolean;
  compact?: boolean;
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box justifyContent="space-between">
      <Text color="gray">{label.padEnd(13)}</Text>
      <Text color={valueColor}>{value}</Text>
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
      <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
        <Text bold color="yellowBright">Instance Profile</Text>
        <Box marginTop={1}>
          <Text color="gray">No instance selected. Pick one in Fleet Matrix.</Text>
        </Box>
      </Box>
    );
  }

  const statusColor =
    server.status === 'running' ? 'greenBright' :
    server.status === 'starting' ? 'yellowBright' :
    server.status === 'stopping' ? 'yellow' :
    'redBright';
  const isRunning = server.status === 'running';
  const network = server.network;
  const meterWidth = compact ? 8 : 12;
  const memoryMeter = createMeter(server.memoryMB, 8192, meterWidth);
  const cpuMeter = createMeter(server.cpuPercent, 100, meterWidth);

  return (
    <Box flexDirection="column" borderStyle="singleDouble" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">Instance Profile</Text>
      <Box marginTop={1} flexDirection="column">
        <DetailRow label="Name" value={server.name} valueColor="cyanBright" />
        <DetailRow label="Status" value={server.status.toUpperCase()} valueColor={statusColor} />
        <DetailRow label="Profile" value={server.config.type} />
        <DetailRow label="Path" value={server.config.path.length > 30 ? `${server.config.path.slice(0, 27)}...` : server.config.path} />
        <DetailRow
          label="Port"
          value={server.config.port ? String(server.config.port) : 'N/A'}
          valueColor={server.portInUse ? 'greenBright' : undefined}
        />
        <DetailRow label="PID" value={server.pid ? String(server.pid) : '-'} />
        <DetailRow label="Uptime" value={server.uptime || '-'} />
        <DetailRow label="Memory" value={`${memoryMeter} ${server.memoryMB ? `${server.memoryMB}MB` : '-'}`} valueColor="green" />
        <DetailRow label="CPU" value={`${cpuMeter} ${server.cpuPercent !== undefined ? `${server.cpuPercent}%` : '-'}`} valueColor="cyan" />
        <DetailRow
          label="Pipeline"
          value={isProcessing ? 'Executing request...' : 'Ready'}
          valueColor={isProcessing ? 'yellowBright' : 'greenBright'}
        />
      </Box>
      <Box marginTop={1}>
        <Text color="gray">{'─'.repeat(compact ? 36 : 48)}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellowBright">Runtime Metrics</Text>
        <Box marginTop={1} flexDirection="column">
          <DetailRow
            label="Total conn"
            value={isRunning && network ? String(network.connections) : '-'}
            valueColor="greenBright"
          />
          <DetailRow
            label="TCP sockets"
            value={isRunning && network ? String(network.tcpConnections) : '-'}
          />
          <DetailRow
            label="UDP sockets"
            value={isRunning && network ? String(network.udpSockets) : '-'}
          />
          <DetailRow
            label="Listening"
            value={isRunning && network ? String(network.listeningSockets) : '-'}
          />
          <DetailRow
            label="Established"
            value={isRunning && network ? String(network.establishedConnections) : '-'}
          />
          <DetailRow
            label="Received"
            value={isRunning && network?.rxBytes !== undefined ? `${Math.round(network.rxBytes / 1024)} KB` : '-'}
            valueColor="cyan"
          />
          <DetailRow
            label="Sent"
            value={isRunning && network?.txBytes !== undefined ? `${Math.round(network.txBytes / 1024)} KB` : '-'}
            valueColor="cyan"
          />
        </Box>
      </Box>
    </Box>
  );
};
