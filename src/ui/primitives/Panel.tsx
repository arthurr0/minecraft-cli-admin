import React from 'react';
import { Box, Text } from 'ink';

type PanelTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const BORDER_COLOR: Record<PanelTone, 'gray' | 'cyanBright' | 'greenBright' | 'yellowBright' | 'redBright'> = {
  neutral: 'gray',
  accent: 'cyanBright',
  success: 'greenBright',
  warning: 'yellowBright',
  danger: 'redBright',
};

export interface PanelProps {
  title: string;
  tone?: PanelTone;
  children: React.ReactNode;
  marginTop?: number;
  width?: number | string;
}

export function Panel({ title, tone = 'neutral', children, marginTop = 0, width }: PanelProps): React.ReactElement {
  const borderColor = BORDER_COLOR[tone];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} marginTop={marginTop} width={width}>
      <Text color={borderColor} bold>{title}</Text>
      <Box flexDirection="column" marginTop={1}>
        {children}
      </Box>
    </Box>
  );
}
