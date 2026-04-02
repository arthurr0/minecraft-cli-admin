import React from 'react';
import { Box, Text } from 'ink';

export interface CommandBarProps {
  command: string;
  prompt?: string;
}

export const CommandBar = React.memo(function CommandBar({
  command,
  prompt = '>',
}: CommandBarProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text color="yellowBright">{prompt} </Text>
      <Text>{command}</Text>
      <Text color="gray">_</Text>
    </Box>
  );
});