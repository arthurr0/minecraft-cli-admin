import React from 'react';
import { Box, Text } from 'ink';

interface LogPanelProps {
  serverName: string;
  logs: string[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ serverName, logs }) => {
  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text bold color="yellow">Logs: {serverName}</Text>
      <Box marginTop={1} flexDirection="column">
        {logs.length === 0 ? (
          <Text color="gray">No logs available</Text>
        ) : (
          logs.slice(-15).map((line, index) => (
            <Text key={index} wrap="truncate-end" color="gray">
              {line}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
};
