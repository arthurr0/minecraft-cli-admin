import React from 'react';
import { Box, Text } from 'ink';

interface ActionBarProps {
  showEditKey?: boolean;
  compact?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({ showEditKey, compact = false }) => {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Text color="gray">Actions</Text>
        <Box gap={2} flexDirection={compact ? 'column' : 'row'}>
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
            <Text color="cyan" bold>[b]</Text>
            <Text> Backup</Text>
          </Text>
          <Text>
            <Text color="white" bold>[c]</Text>
            <Text> Console</Text>
          </Text>
        </Box>
        <Box gap={2} flexDirection={compact ? 'column' : 'row'}>
          <Text>
            <Text color="yellow" bold>[Enter]</Text>
            <Text> Refresh</Text>
          </Text>
          {showEditKey && (
            <Text>
              <Text color="gray" bold>[e]</Text>
              <Text> Config</Text>
            </Text>
          )}
          <Text>
            <Text color="magenta" bold>[q]</Text>
            <Text> Quit</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
