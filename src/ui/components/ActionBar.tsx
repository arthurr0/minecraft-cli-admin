import React from 'react';
import { Box, Text } from 'ink';

interface ActionBarProps {
  message?: string;
  showEditKey?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({ message, showEditKey }) => {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color="gray">{'─'.repeat(70)}</Text>
      </Box>
      {message && (
        <Box marginBottom={1}>
          <Text color="yellow">{message}</Text>
        </Box>
      )}
      <Box gap={2}>
        <Text>
          <Text color="green" bold>[s]</Text>
          <Text> Start</Text>
        </Text>
        <Text>
          <Text color="red" bold>[x]</Text>
          <Text> Stop</Text>
        </Text>
        <Text>
          <Text color="yellow" bold>[r]</Text>
          <Text> Restart</Text>
        </Text>
        <Text>
          <Text color="white" bold>[c]</Text>
          <Text> Console</Text>
        </Text>
        <Text>
          <Text color="blue" bold>[l]</Text>
          <Text> Logs</Text>
        </Text>
        <Text>
          <Text color="cyan" bold>[b]</Text>
          <Text> Backup</Text>
        </Text>
        {showEditKey && (
          <Text>
            <Text color="gray" bold>[e]</Text>
            <Text> Edit</Text>
          </Text>
        )}
        <Text>
          <Text color="magenta" bold>[q]</Text>
          <Text> Quit</Text>
        </Text>
      </Box>
    </Box>
  );
};
