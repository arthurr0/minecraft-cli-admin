import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface ListInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  focused?: boolean;
  error?: string;
}

export const ListInput: React.FC<ListInputProps> = ({
  label,
  items,
  onChange,
  focused = false,
  error,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  React.useEffect(() => {
    if (editingIndex === null) return;
    const interval = setInterval(() => setShowCursor(s => !s), 500);
    return () => clearInterval(interval);
  }, [editingIndex]);

  useInput((input, key) => {
    if (!focused) return;

    if (editingIndex !== null) {
      if (key.return) {
        if (editValue.trim()) {
          const newItems = [...items];
          if (editingIndex >= items.length) {
            newItems.push(editValue.trim());
          } else {
            newItems[editingIndex] = editValue.trim();
          }
          onChange(newItems);
        }
        setEditingIndex(null);
        setEditValue('');
        return;
      }

      if (key.escape) {
        setEditingIndex(null);
        setEditValue('');
        return;
      }

      if (key.backspace || key.delete) {
        if (cursorPosition > 0) {
          setEditValue(v => v.slice(0, cursorPosition - 1) + v.slice(cursorPosition));
          setCursorPosition(c => c - 1);
        }
        return;
      }

      if (key.leftArrow) {
        setCursorPosition(c => Math.max(0, c - 1));
        return;
      }

      if (key.rightArrow) {
        setCursorPosition(c => Math.min(editValue.length, c + 1));
        return;
      }

      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setEditValue(v => v.slice(0, cursorPosition) + input + v.slice(cursorPosition));
        setCursorPosition(c => c + 1);
      }
      return;
    }

    if (key.return || input === ' ') {
      if (!isExpanded) {
        setIsExpanded(true);
      } else if (items.length > 0) {
        setEditingIndex(selectedIndex);
        setEditValue(items[selectedIndex] || '');
        setCursorPosition(items[selectedIndex]?.length || 0);
      }
      return;
    }

    if (key.escape) {
      setIsExpanded(false);
      return;
    }

    if (isExpanded) {
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setSelectedIndex(i => Math.min(items.length, i + 1));
      } else if (input === 'a') {
        setEditingIndex(items.length);
        setEditValue('');
        setCursorPosition(0);
        setSelectedIndex(items.length);
      } else if (input === 'd' && items.length > 0 && selectedIndex < items.length) {
        const newItems = items.filter((_, i) => i !== selectedIndex);
        onChange(newItems);
        setSelectedIndex(i => Math.min(i, newItems.length - 1));
      }
    }
  });

  const renderEditField = (value: string) => {
    const before = value.slice(0, cursorPosition);
    const cursor = value[cursorPosition] || ' ';
    const after = value.slice(cursorPosition + 1);
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
        <Text color={focused ? 'cyan' : 'white'}>
          {isExpanded ? '[-]' : '[+]'} {items.length} items
        </Text>
      </Box>
      {isExpanded && (
        <Box flexDirection="column" marginLeft={2}>
          {items.map((item, index) => (
            <Box key={index}>
              <Text
                color={index === selectedIndex ? 'cyan' : 'white'}
                bold={index === selectedIndex}
              >
                {index === selectedIndex ? '> ' : '  '}
              </Text>
              {editingIndex === index ? (
                renderEditField(editValue)
              ) : (
                <Text color={index === selectedIndex ? 'cyan' : 'gray'}>{item}</Text>
              )}
            </Box>
          ))}
          <Box>
            <Text
              color={selectedIndex === items.length ? 'cyan' : 'gray'}
              bold={selectedIndex === items.length}
            >
              {selectedIndex === items.length ? '> ' : '  '}
            </Text>
            {editingIndex === items.length ? (
              renderEditField(editValue)
            ) : (
              <Text color="gray" italic>
                [a] Add new item
              </Text>
            )}
          </Box>
          <Box marginTop={1}>
            <Text color="gray">Enter=edit  a=add  d=delete  Esc=close</Text>
          </Box>
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
