import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

interface ServerDetailsPanelProps {
  server?: ServerInfo;
  isProcessing?: boolean;
  compact?: boolean;
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box justifyContent="space-between">
      <Text color="gray">{label.padEnd(11)}</Text>
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
      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
        <Text bold color="yellow">Server Details</Text>
        <Box marginTop={1}>
          <Text color="gray">No server configured yet. Add one from the config menu.</Text>
        </Box>
      </Box>
    );
  }

  const statusColor = server.status === 'running' ? 'green' : 'red';
  const isRunning = server.status === 'running';
  const network = server.network;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1}>
      <Text bold color="blue">Selected Server</Text>
      <Box marginTop={1} flexDirection="column">
        <DetailRow label="Name" value={server.name} valueColor="cyan" />
        <DetailRow label="Status" value={server.status.toUpperCase()} valueColor={statusColor} />
        <DetailRow label="Type" value={server.config.type} />
        <DetailRow label="Path" value={server.config.path} />
        <DetailRow
          label="Port"
          value={server.config.port ? String(server.config.port) : 'N/A'}
          valueColor={server.portInUse ? 'green' : undefined}
        />
        <DetailRow label="PID" value={server.pid ? String(server.pid) : '-'} />
        {!compact && <DetailRow label="Uptime" value={server.uptime || '-'} />}
        <DetailRow label="Memory" value={server.memoryMB ? `${server.memoryMB} MB` : '-'} />
        <DetailRow label="CPU" value={server.cpuPercent !== undefined ? `${server.cpuPercent}%` : '-'} />
        <DetailRow
          label="Action"
          value={isProcessing ? 'Processing request...' : 'Idle'}
          valueColor={isProcessing ? 'yellow' : 'green'}
        />
      </Box>
      <Box marginTop={1}>
        <Text color="gray">{'─'.repeat(compact ? 28 : 36)}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">Runtime Metrics</Text>
        <Box marginTop={1} flexDirection="column">
          <DetailRow
            label="Connections"
            value={isRunning && network ? String(network.connections) : '-'}
            valueColor="green"
          />
          <DetailRow
            label="Received"
            value={isRunning && network?.rxBytes !== undefined ? `${Math.round(network.rxBytes / 1024)} KB` : '-'}
          />
          <DetailRow
            label="Sent"
            value={isRunning && network?.txBytes !== undefined ? `${Math.round(network.txBytes / 1024)} KB` : '-'}
          />
        </Box>
      </Box>
    </Box>
  );
};
