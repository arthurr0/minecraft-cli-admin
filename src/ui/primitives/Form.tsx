import React from 'react';
import { Box, Text } from 'ink';

export interface FieldRowProps {
  label: string;
  value: string;
  focused: boolean;
  error?: string;
  width?: number;
}

export function FieldRow({
  label,
  value,
  focused,
  error,
  width = 48,
}: FieldRowProps): React.ReactElement {
  const display = value.trim() === '' ? ' ' : value;
  const safeWidth = Math.max(8, width);
  const clip = display.length > safeWidth ? `${display.slice(0, safeWidth - 3)}...` : display;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={focused ? 'cyanBright' : 'gray'} bold={focused}>{label.padEnd(14)}</Text>
        <Text color="gray">: </Text>
        <Text color={focused ? 'black' : 'white'} inverse={focused}>{clip}</Text>
      </Box>
      {error ? <Text color="redBright">  {error}</Text> : null}
    </Box>
  );
}

export interface FormShellProps {
  title: string;
  children: React.ReactNode;
  help: string;
  error?: string;
}

export function FormShell({ title, children, help, error }: FormShellProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text color="cyanBright" bold>{title}</Text>
      <Box marginTop={1} flexDirection="column">
        {children}
      </Box>
      {error ? <Text color="redBright">{error}</Text> : null}
      <Box marginTop={1}>
        <Text color="gray">{help}</Text>
      </Box>
    </Box>
  );
}
