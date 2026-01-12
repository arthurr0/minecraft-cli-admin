import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

export interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  error?: string;
  focused?: boolean;
  disabled?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  onSubmit,
  placeholder = '',
  error,
  focused = false,
  disabled = false,
}) => {
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!focused) return;
    const interval = setInterval(() => {
      setShowCursor(s => !s);
    }, 500);
    return () => clearInterval(interval);
  }, [focused]);

  useEffect(() => {
    setCursorPosition(value.length);
  }, [value.length]);

  useInput((input, key) => {
    if (!focused || disabled) return;

    if (key.return) {
      onSubmit?.();
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange(newValue);
        setCursorPosition(c => c - 1);
      }
      return;
    }

    if (key.leftArrow) {
      setCursorPosition(c => Math.max(0, c - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPosition(c => Math.min(value.length, c + 1));
      return;
    }

    if (key.upArrow || key.downArrow || key.tab || key.escape) {
      return;
    }

    if (input && input.length === 1 && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(c => c + 1);
    }
  });

  const displayValue = value || '';
  const showPlaceholder = !displayValue && placeholder && !focused;

  const renderValue = () => {
    if (showPlaceholder) {
      return <Text color="gray">{placeholder}</Text>;
    }

    if (!focused) {
      return <Text>{displayValue || ' '}</Text>;
    }

    const before = displayValue.slice(0, cursorPosition);
    const cursor = displayValue[cursorPosition] || ' ';
    const after = displayValue.slice(cursorPosition + 1);

    return (
      <Text>
        {before}
        <Text inverse={showCursor}>{cursor}</Text>
        {after}
      </Text>
    );
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={focused ? 'cyan' : 'white'} bold={focused}>
          {label}:{' '}
        </Text>
        <Box borderStyle={focused ? 'single' : undefined} borderColor={error ? 'red' : 'gray'} paddingX={error ? 0 : undefined}>
          {renderValue()}
        </Box>
      </Box>
      {error && (
        <Box marginLeft={label.length + 2}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
};
