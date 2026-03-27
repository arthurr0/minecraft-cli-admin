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
        <Text color={focused ? 'yellowBright' : 'gray'} bold={focused}>
          {label}:{' '}
        </Text>
        <Box borderStyle={focused ? 'doubleSingle' : 'single'} borderColor={error ? 'redBright' : focused ? 'cyan' : 'gray'} paddingX={1}>
          <Text color={focused ? 'whiteBright' : 'white'}>
            {isOpen ? 'OPEN' : 'CLOSED'} :: {selectedOption?.label || '(none)'}
          </Text>
        </Box>
      </Box>
      {isOpen && (
        <Box flexDirection="column" marginLeft={label.length + 2}>
          {options.map((option, index) => (
            <Box key={option.value}>
              <Text
                color={index === highlightedIndex ? 'black' : 'white'}
                bold={index === highlightedIndex}
                inverse={index === highlightedIndex}
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
          <Text color="redBright">{error.toUpperCase()}</Text>
        </Box>
      )}
    </Box>
  );
};
