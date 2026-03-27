import React from 'react';
import { Box, Text } from 'ink';

export type MessageLevel = 'info' | 'success' | 'error';

export interface MessageBarProps {
  message?: string;
  level?: MessageLevel;
  fullWidth?: boolean;
}

const LEVEL_STYLES: Record<MessageLevel, { color: 'blueBright' | 'greenBright' | 'redBright'; label: string }> = {
  info: { color: 'blueBright', label: 'STREAM' },
  success: { color: 'greenBright', label: 'SUCCESS' },
  error: { color: 'redBright', label: 'ALERT' },
};

export const MessageBar: React.FC<MessageBarProps> = ({ message, level = 'info', fullWidth = false }) => {
  if (!message) {
    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1} width={fullWidth ? '100%' : undefined}>
        <Text color="gray">Event Stream idle. Select an instance and run a command.</Text>
      </Box>
    );
  }

  const style = LEVEL_STYLES[level];

  return (
    <Box borderStyle="single" borderColor={style.color} paddingX={1} width={fullWidth ? '100%' : undefined}>
      <Text color={style.color} bold>
        {style.label}
      </Text>
      <Text color="gray"> | </Text>
      <Text wrap="truncate-end">{message}</Text>
    </Box>
  );
};
