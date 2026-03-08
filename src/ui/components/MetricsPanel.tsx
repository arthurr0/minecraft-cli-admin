import React from 'react';
import { Box, Text } from 'ink';
import type { ServerInfo } from '../../types/server.js';

interface MetricsPanelProps {
  server?: ServerInfo;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box justifyContent="space-between">
      <Text color="gray">{label}</Text>
      <Text color={color}>{value}</Text>
    </Box>
  );
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ server }) => {
  if (!server) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text bold color="yellow">Live Metrics</Text>
        <Box marginTop={1}>
          <Text color="gray">Select a server to inspect runtime metrics.</Text>
        </Box>
      </Box>
    );
  }

  const isRunning = server.status === 'running';
  const network = server.network;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">Live Metrics</Text>
      <Text color="gray">Refreshed with the dashboard status poll.</Text>
      <Box marginTop={1} flexDirection="column">
        <MetricRow
          label="CPU"
          value={isRunning && server.cpuPercent !== undefined ? `${server.cpuPercent}%` : '-'}
          color="yellow"
        />
        <MetricRow
          label="RAM"
          value={isRunning && server.memoryMB !== undefined ? `${server.memoryMB} MB` : '-'}
          color="cyan"
        />
        <MetricRow
          label="Network connections"
          value={isRunning && network ? String(network.connections) : '-'}
          color="green"
        />
        <MetricRow
          label="Received"
          value={isRunning && network ? formatBytes(network.rxBytes) : '-'}
        />
        <MetricRow
          label="Sent"
          value={isRunning && network ? formatBytes(network.txBytes) : '-'}
        />
      </Box>
    </Box>
  );
};
