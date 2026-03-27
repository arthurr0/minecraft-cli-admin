import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(1);

  useInput((input, key) => {
    if (input === 'y' || input === 'Y') {
      onConfirm();
      return;
    }

    if (input === 'n' || input === 'N' || key.escape) {
      onCancel();
      return;
    }

    if (key.leftArrow || key.rightArrow) {
      setSelectedIndex(i => i === 0 ? 1 : 0);
      return;
    }

    if (key.return) {
      if (selectedIndex === 0) {
        onConfirm();
      } else {
        onCancel();
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="doubleSingle" borderColor="yellowBright" paddingX={1}>
        <Text color="yellowBright" bold>CONFIRMATION GATE</Text>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text>{message.toUpperCase()}</Text>
      </Box>

      <Box marginTop={1} gap={2}>
        <Text color={selectedIndex === 0 ? 'black' : 'greenBright'} inverse={selectedIndex === 0} bold>
          {' '}[Y] {confirmLabel}{' '}
        </Text>

        <Text color={selectedIndex === 1 ? 'black' : 'redBright'} inverse={selectedIndex === 1} bold>
          {' '}[N] {cancelLabel}{' '}
        </Text>
      </Box>
    </Box>
  );
};
