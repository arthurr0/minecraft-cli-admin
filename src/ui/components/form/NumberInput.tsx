import React from 'react';
import { TextInput, type TextInputProps } from './TextInput.js';

export interface NumberInputProps extends Omit<TextInputProps, 'value' | 'onChange'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  ...props
}) => {
  const handleChange = (text: string) => {
    if (text === '') {
      onChange(undefined);
      return;
    }

    const filtered = text.replace(/[^0-9]/g, '');
    if (filtered === '') {
      onChange(undefined);
      return;
    }

    let num = parseInt(filtered, 10);

    if (min !== undefined && num < min) {
      num = min;
    }
    if (max !== undefined && num > max) {
      num = max;
    }

    onChange(num);
  };

  return (
    <TextInput
      {...props}
      value={value?.toString() ?? ''}
      onChange={handleChange}
    />
  );
};
