import React from 'react';
import { Box, Text } from 'ink';

export type MessageLevel = 'info' | 'success' | 'error';

export interface MessageBarProps {
  message?: string;
  level?: MessageLevel;
  fullWidth?: boolean;
}

const STYLE_MAP: Record<MessageLevel, {
  border: 'blueBright' | 'greenBright' | 'redBright';
  tag: string;
}> = {
  info: { border: 'blueBright', tag: 'INFO' },
  success: { border: 'greenBright', tag: 'OK' },
  error: { border: 'redBright', tag: 'FAIL' },
};

export const MessageBar: React.FC<MessageBarProps> = ({
  message,
  level = 'info',
  fullWidth = false,
}) => {
  if (!message) {
    return (
      <Box borderStyle="doubleSingle" borderColor="gray" paddingX={1} width={fullWidth ? '100%' : undefined}>
        <Text color="gray">SYSTEM IDLE :: choose instance and execute command</Text>
      </Box>
    );
  }

  const style = STYLE_MAP[level];

  return (
    <Box borderStyle="doubleSingle" borderColor={style.border} paddingX={1} width={fullWidth ? '100%' : undefined}>
      <Text color={style.border} bold>{style.tag}</Text>
      <Text color="gray"> :: </Text>
      <Text wrap="truncate-end">{message}</Text>
    </Box>
  );
};
