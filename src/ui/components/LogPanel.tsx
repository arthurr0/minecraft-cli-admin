import React from 'react';
import { Box, Text } from 'ink';

interface LogPanelProps {
  serverName: string;
  logs: string[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ serverName, logs }) => {
  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1} height={15}>
      <Text bold color="yellow">Logs: {serverName}</Text>
      <Box marginTop={1} flexDirection="column" overflow="hidden">
        {logs.length === 0 ? (
          <Text color="gray">No logs available</Text>
        ) : (
          logs.slice(-10).map((line, index) => (
            <Text key={index} wrap="truncate" color="gray">
              {line.slice(0, 60)}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
};
