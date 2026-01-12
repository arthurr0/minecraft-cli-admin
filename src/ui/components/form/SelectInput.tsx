import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectInputProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  focused?: boolean;
  error?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  options,
  value,
  onChange,
  focused = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    const idx = options.findIndex(o => o.value === value);
    return idx >= 0 ? idx : 0;
  });

  const selectedOption = options.find(o => o.value === value);

  useInput((input, key) => {
    if (!focused) return;

    if (key.return || input === ' ') {
      if (isOpen) {
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
      return;
    }

    if (key.escape) {
      setIsOpen(false);
      return;
    }

    if (isOpen) {
      if (key.upArrow) {
        setHighlightedIndex(i => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setHighlightedIndex(i => Math.min(options.length - 1, i + 1));
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={focused ? 'cyan' : 'white'} bold={focused}>
          {label}:{' '}
        </Text>
        <Box>
          <Text color={focused ? 'cyan' : 'white'}>
            {isOpen ? '[-]' : '[+]'} {selectedOption?.label || '(none)'}
          </Text>
        </Box>
      </Box>
      {isOpen && (
        <Box flexDirection="column" marginLeft={label.length + 2}>
          {options.map((option, index) => (
            <Box key={option.value}>
              <Text
                color={index === highlightedIndex ? 'cyan' : 'white'}
                bold={index === highlightedIndex}
              >
                {index === highlightedIndex ? '> ' : '  '}
                {option.label}
              </Text>
            </Box>
          ))}
        </Box>
      )}
      {error && (
        <Box marginLeft={label.length + 2}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
};
