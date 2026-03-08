import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title: string;
  activeMode: string;
  totalServers: number;
  runningServers: number;
  configPath: string;
  lastUpdated?: string;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  activeMode,
  totalServers,
  runningServers,
  configPath,
  lastUpdated,
  isRefreshing = false,
}) => {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">{title}</Text>
        <Text color="gray">
          {isRefreshing ? 'Refreshing' : `Updated ${lastUpdated ?? '--:--:--'}`}
        </Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">
          Mode: <Text color="yellow">{activeMode}</Text>
          {'  '}
          Servers: <Text color="green">{runningServers}</Text>/<Text>{totalServers}</Text>
        </Text>
        <Text color="gray" wrap="truncate-end">
          Config: {configPath}
        </Text>
      </Box>
    </Box>
  );
};
