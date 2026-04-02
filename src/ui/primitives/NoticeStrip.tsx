import React from 'react';
import { Box, Text } from 'ink';
import type { Notice } from '../core/types.js';

const LEVEL_STYLE: Record<NonNullable<Notice['level']>, {
  border: 'gray' | 'yellowBright' | 'greenBright' | 'redBright';
  tag: string;
}> = {
  info: { border: 'yellowBright', tag: 'INFO' },
  success: { border: 'greenBright', tag: 'OK' },
  error: { border: 'redBright', tag: 'ERR' },
};

export interface NoticeStripProps {
  notice?: Notice;
  idleText?: string;
}

export function NoticeStrip({
  notice,
  idleText = 'Ready. Select a server and run an action.',
}: NoticeStripProps): React.ReactElement {
  if (!notice) {
    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">{idleText}</Text>
      </Box>
    );
  }

  const style = LEVEL_STYLE[notice.level];

  return (
    <Box borderStyle="single" borderColor={style.border} paddingX={1}>
      <Text color={style.border} bold>{style.tag}</Text>
      <Text color="gray"> :: </Text>
      <Text wrap="truncate-end">{notice.text}</Text>
    </Box>
  );
}
