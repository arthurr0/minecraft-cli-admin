import React from 'react';
import { Box, Text } from 'ink';

interface ActionBarProps {
  showEditKey?: boolean;
  compact?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({ showEditKey, compact = false }) => {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1} flexDirection="column">
        <Text color="cyan" bold>Command Deck</Text>
        <Box gap={2} flexDirection={compact ? 'column' : 'row'}>
          <Text>
            <Text color="greenBright" bold>[S]</Text>
            <Text> Start</Text>
          </Text>
          <Text>
            <Text color="redBright" bold>[X]</Text>
            <Text> Stop</Text>
          </Text>
          <Text>
            <Text color="yellowBright" bold>[R]</Text>
            <Text> Restart</Text>
          </Text>
          <Text>
            <Text color="blueBright" bold>[B]</Text>
            <Text> Backup</Text>
          </Text>
          <Text>
            <Text color="whiteBright" bold>[C]</Text>
            <Text> Console</Text>
          </Text>
        </Box>
        <Box gap={2} flexDirection={compact ? 'column' : 'row'}>
          <Text>
            <Text color="yellowBright" bold>[Enter]</Text>
            <Text> Sync</Text>
          </Text>
          {showEditKey && (
            <Text>
              <Text color="magentaBright" bold>[E]</Text>
              <Text> Studio Config</Text>
            </Text>
          )}
          <Text>
            <Text color="red" bold>[Q]</Text>
            <Text> Exit</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
