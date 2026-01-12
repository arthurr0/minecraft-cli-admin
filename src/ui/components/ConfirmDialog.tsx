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
  confirmLabel = 'Yes',
  cancelLabel = 'No',
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
      <Box borderStyle="single" borderColor="yellow" paddingX={1} paddingY={0}>
        <Text color="yellow" bold>Confirm</Text>
      </Box>
      <Box marginTop={1}>
        <Text>{message}</Text>
      </Box>
      <Box marginTop={1} gap={2}>
        <Box>
          <Text
            color={selectedIndex === 0 ? 'green' : 'white'}
            bold={selectedIndex === 0}
            inverse={selectedIndex === 0}
          >
            {' '}[y] {confirmLabel}{' '}
          </Text>
        </Box>
        <Box>
          <Text
            color={selectedIndex === 1 ? 'red' : 'white'}
            bold={selectedIndex === 1}
            inverse={selectedIndex === 1}
          >
            {' '}[n] {cancelLabel}{' '}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
