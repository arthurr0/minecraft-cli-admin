import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title: string;
  activeMode: string;
  totalServers: number;
  runningServers: number;
  configPath: string;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  activeMode,
  totalServers,
  runningServers,
  configPath,
  isRefreshing = false,
}) => {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">{title}</Text>
        <Text color="gray">
          {isRefreshing ? 'Refreshing  ' : ''}
          {time}
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
