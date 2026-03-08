import React from 'react';
import { Box, Text } from 'ink';

export type MessageLevel = 'info' | 'success' | 'error';

export interface MessageBarProps {
  message?: string;
  level?: MessageLevel;
}

const LEVEL_STYLES: Record<MessageLevel, { color: 'blue' | 'green' | 'red'; label: string }> = {
  info: { color: 'blue', label: 'INFO' },
  success: { color: 'green', label: 'OK' },
  error: { color: 'red', label: 'ERROR' },
};

export const MessageBar: React.FC<MessageBarProps> = ({ message, level = 'info' }) => {
  if (!message) {
    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">Ready. Select a server to inspect details or trigger an action.</Text>
      </Box>
    );
  }

  const style = LEVEL_STYLES[level];

  return (
    <Box borderStyle="single" borderColor={style.color} paddingX={1}>
      <Text color={style.color} bold>
        {style.label}
      </Text>
      <Text> </Text>
      <Text wrap="truncate-end">{message}</Text>
    </Box>
  );
};
