import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '../form/TextInput.js';
import { NumberInput } from '../form/NumberInput.js';
import { SelectInput } from '../form/SelectInput.js';
import type { ServerConfig } from '../../../types/config.js';
import {
  validateServerName,
  validatePath,
  validatePort,
} from '../../../utils/validator.js';

export interface ServerFormProps {
  isNew: boolean;
  serverName?: string;
  initialValues?: ServerConfig;
  serverTypes: string[];
  onSave: (name: string, config: ServerConfig) => Promise<void>;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  type: string;
  path: string;
  port: number | undefined;
}

export const ServerForm: React.FC<ServerFormProps> = ({
  isNew,
  serverName,
  initialValues,
  serverTypes,
  onSave,
  onCancel,
}) => {
  const [values, setValues] = useState<FormValues>({
    name: serverName || '',
    type: initialValues?.type || serverTypes[0] || '',
    path: initialValues?.path || '',
    port: initialValues?.port,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fieldCount = isNew ? 4 : 3;

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (isNew) {
      const nameResult = validateServerName(values.name);
      if (!nameResult.valid) {
        newErrors.name = nameResult.error!;
      }
    }

    const pathResult = validatePath(values.path);
    if (!pathResult.valid) {
      newErrors.path = pathResult.error!;
    }

    if (values.port !== undefined) {
      const portResult = validatePort(values.port);
      if (!portResult.valid) {
        newErrors.port = portResult.error!;
      }
    }

    if (!values.type) {
      newErrors.type = 'Server type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [isNew, values]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const config: ServerConfig = {
        type: values.type,
        path: values.path,
        port: values.port,
      };
      await onSave(isNew ? values.name : serverName!, config);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save');
      setIsSubmitting(false);
    }
  }, [validate, values, isNew, serverName, onSave]);

  useInput((input, key) => {
    if (isSubmitting) return;

    if (key.escape) {
      onCancel();
      return;
    }

    if (key.ctrl && input === 's') {
      handleSubmit();
      return;
    }

    if (key.tab && !key.shift) {
      setFocusedField(f => (f + 1) % fieldCount);
      return;
    }

    if (key.tab && key.shift) {
      setFocusedField(f => (f - 1 + fieldCount) % fieldCount);
      return;
    }
  });

  const getFieldIndex = (field: string): number => {
    if (isNew) {
      return { name: 0, type: 1, path: 2, port: 3 }[field] ?? 0;
    }
    return { type: 0, path: 1, port: 2 }[field] ?? 0;
  };

  const typeOptions = serverTypes.map(t => ({ label: t, value: t }));

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan" bold>
          {isNew ? 'Add New Server' : `Edit Server: ${serverName}`}
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1} gap={1}>
        {isNew && (
          <TextInput
            label="Name"
            value={values.name}
            onChange={v => setValues(prev => ({ ...prev, name: v }))}
            focused={focusedField === getFieldIndex('name')}
            error={errors.name}
            placeholder="my-server"
          />
        )}

        <SelectInput
          label="Type"
          options={typeOptions}
          value={values.type}
          onChange={v => setValues(prev => ({ ...prev, type: v }))}
          focused={focusedField === getFieldIndex('type')}
          error={errors.type}
        />

        <TextInput
          label="Path"
          value={values.path}
          onChange={v => setValues(prev => ({ ...prev, path: v }))}
          focused={focusedField === getFieldIndex('path')}
          error={errors.path}
          placeholder="/opt/minecraft/server"
        />

        <NumberInput
          label="Port"
          value={values.port}
          onChange={v => setValues(prev => ({ ...prev, port: v }))}
          focused={focusedField === getFieldIndex('port')}
          error={errors.port}
          placeholder="25565 (optional)"
          min={1}
          max={65535}
        />
      </Box>

      {formError && (
        <Box marginTop={1}>
          <Text color="red">{formError}</Text>
        </Box>
      )}

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          Tab=next field  Ctrl+S=save  Esc=cancel
        </Text>
      </Box>

      {isSubmitting && (
        <Box marginTop={1}>
          <Text color="yellow">Saving...</Text>
        </Box>
      )}
    </Box>
  );
};
