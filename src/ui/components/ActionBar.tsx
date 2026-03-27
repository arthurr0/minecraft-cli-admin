import React from 'react';
import { Box, Text } from 'ink';

interface ActionBarProps {
  showEditKey?: boolean;
  compact?: boolean;
}

function keycap(key: string, label: string, color: string) {
  return (
    <Text>
      <Text color={color} bold>{`<${key}>`}</Text>
      <Text color="gray"> {label}</Text>
    </Text>
  );
}

export const ActionBar: React.FC<ActionBarProps> = ({ showEditKey, compact = false }) => {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box borderStyle="doubleSingle" borderColor="blueBright" paddingX={1} flexDirection="column">
        <Text color="blueBright" bold>COMMAND DECK</Text>

        <Box marginTop={1} flexDirection={compact ? 'column' : 'row'} gap={2}>
          {keycap('S', 'start', 'greenBright')}
          {keycap('X', 'stop', 'redBright')}
          {keycap('R', 'restart', 'yellowBright')}
          {keycap('B', 'backup', 'cyan')}
          {keycap('C', 'console', 'whiteBright')}
        </Box>

        <Box marginTop={compact ? 0 : 1} flexDirection={compact ? 'column' : 'row'} gap={2}>
          {keycap('ENTER', 'refresh', 'yellowBright')}
          {showEditKey ? keycap('E', 'config', 'magentaBright') : <Text color="gray"> </Text>}
          {keycap('Q', 'quit', 'red')}
        </Box>
      </Box>
    </Box>
  );
};
