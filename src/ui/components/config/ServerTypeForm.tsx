import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '../form/TextInput.js';
import { ListInput } from '../form/ListInput.js';
import type { ServerTypeConfig } from '../../../types/config.js';
import {
  validateServerTypeName,
  validateMemoryFormat,
} from '../../../utils/validator.js';

export interface ServerTypeFormProps {
  isNew: boolean;
  typeName?: string;
  initialValues?: ServerTypeConfig;
  onSave: (name: string, config: ServerTypeConfig) => Promise<void>;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  memory: string;
  min_memory: string;
  jvm_flags: string[];
}

export const ServerTypeForm: React.FC<ServerTypeFormProps> = ({
  isNew,
  typeName,
  initialValues,
  onSave,
  onCancel,
}) => {
  const [values, setValues] = useState<FormValues>({
    name: typeName || '',
    memory: initialValues?.memory || '2G',
    min_memory: initialValues?.min_memory || '1G',
    jvm_flags: initialValues?.jvm_flags || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fieldCount = isNew ? 4 : 3;

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (isNew) {
      const nameResult = validateServerTypeName(values.name);
      if (!nameResult.valid) {
        newErrors.name = nameResult.error!;
      }
    }

    const memoryResult = validateMemoryFormat(values.memory);
    if (!memoryResult.valid) {
      newErrors.memory = memoryResult.error!;
    }

    const minMemoryResult = validateMemoryFormat(values.min_memory);
    if (!minMemoryResult.valid) {
      newErrors.min_memory = minMemoryResult.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [isNew, values]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const config: ServerTypeConfig = {
        memory: values.memory,
        min_memory: values.min_memory,
        jvm_flags: values.jvm_flags,
      };
      await onSave(isNew ? values.name : typeName!, config);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save');
      setIsSubmitting(false);
    }
  }, [validate, values, isNew, typeName, onSave]);

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
      return { name: 0, memory: 1, min_memory: 2, jvm_flags: 3 }[field] ?? 0;
    }
    return { memory: 0, min_memory: 1, jvm_flags: 2 }[field] ?? 0;
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan" bold>
          {isNew ? 'Add New Server Type' : `Edit Type: ${typeName}`}
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
            placeholder="my-type"
          />
        )}

        <TextInput
          label="Memory"
          value={values.memory}
          onChange={v => setValues(prev => ({ ...prev, memory: v }))}
          focused={focusedField === getFieldIndex('memory')}
          error={errors.memory}
          placeholder="2G"
        />

        <TextInput
          label="Min Memory"
          value={values.min_memory}
          onChange={v => setValues(prev => ({ ...prev, min_memory: v }))}
          focused={focusedField === getFieldIndex('min_memory')}
          error={errors.min_memory}
          placeholder="1G"
        />

        <ListInput
          label="JVM Flags"
          items={values.jvm_flags}
          onChange={flags => setValues(prev => ({ ...prev, jvm_flags: flags }))}
          focused={focusedField === getFieldIndex('jvm_flags')}
          error={errors.jvm_flags}
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
