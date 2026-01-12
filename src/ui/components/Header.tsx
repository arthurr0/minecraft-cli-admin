import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const time = new Date().toLocaleTimeString();

  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text bold color="cyan">{title}</Text>
      <Text color="gray">{time}</Text>
    </Box>
  );
};
