import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title: string;
  activeMode: string;
  totalServers: number;
  runningServers: number;
  configPath: string;
  compact?: boolean;
  lastUpdated?: string;
  isRefreshing?: boolean;
}

function meter(running: number, total: number, width: number): string {
  if (total <= 0) {
    return '░'.repeat(width);
  }

  const ratio = Math.max(0, Math.min(1, running / total));
  const fill = Math.round(ratio * width);
  return `${'▓'.repeat(fill)}${'░'.repeat(width - fill)}`;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  activeMode,
  totalServers,
  runningServers,
  configPath,
  compact = false,
  lastUpdated,
  isRefreshing = false,
}) => {
  const health = meter(runningServers, totalServers, compact ? 10 : 16);
  const percent = totalServers === 0 ? 0 : Math.round((runningServers / totalServers) * 100);

  return (
    <Box flexDirection="column" borderStyle="doubleSingle" borderColor="greenBright" paddingX={1}>
      <Box justifyContent="space-between">
        <Text>
          <Text color="greenBright" bold>[MINT DATA STUDIO]</Text>
          <Text color="gray">  </Text>
          <Text bold color="whiteBright">{title}</Text>
        </Text>
        <Text color={isRefreshing ? 'yellowBright' : 'gray'}>
          {isRefreshing ? 'LIVE SYNC' : `UPDATED ${lastUpdated ?? '--:--:--'}`}
        </Text>
      </Box>

      <Box justifyContent="space-between" flexDirection={compact ? 'column' : 'row'}>
        <Text>
          <Text color="yellowBright">MODE</Text>
          <Text> {activeMode}</Text>
          <Text color="gray"> | </Text>
          <Text color="greenBright">FLEET</Text>
          <Text> {runningServers}/{totalServers}</Text>
          <Text color="gray"> | </Text>
          <Text color={percent >= 75 ? 'greenBright' : percent >= 40 ? 'yellowBright' : 'redBright'}>
            HEALTH {health} {percent}%
          </Text>
        </Text>
        <Text color="gray" wrap="truncate-end">CONFIG {configPath}</Text>
      </Box>
    </Box>
  );
};
