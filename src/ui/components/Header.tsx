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
  const barWidth = compact ? 14 : 22;
  const ratio = totalServers === 0 ? 0 : runningServers / totalServers;
  const filled = Math.max(0, Math.min(barWidth, Math.round(ratio * barWidth)));
  const healthBar = `${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}`;

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="greenBright" paddingX={1}>
      <Box flexDirection={compact ? 'column' : 'row'} justifyContent="space-between" gap={compact ? 0 : 2}>
        <Text bold color="greenBright">{title}</Text>
        <Text color={isRefreshing ? 'yellowBright' : 'gray'}>
          {isRefreshing ? 'Live sync in progress' : `Updated ${lastUpdated ?? '--:--:--'}`}
        </Text>
      </Box>
      <Box flexDirection={compact ? 'column' : 'row'} justifyContent="space-between" gap={compact ? 0 : 2}>
        <Text color="white">
          Mode <Text color="yellowBright" bold>{activeMode}</Text>
          {'  '}
          Fleet <Text color="greenBright" bold>{runningServers}</Text>/<Text>{totalServers}</Text>
          {'  '}
          <Text color="greenBright">{healthBar}</Text>
        </Text>
        <Text color="gray" wrap="truncate-end">
          Registry {configPath}
        </Text>
      </Box>
    </Box>
  );
};
