import { useState, useCallback } from 'react';
import { useInput } from 'ink';

export interface UseFormOptions<T> {
  initialValues: T;
  fieldCount: number;
  onSubmit: (values: T) => Promise<void>;
  onCancel: () => void;
  validate?: (values: T) => Record<string, string>;
}

export interface UseFormReturn<T> {
  values: T;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  errors: Record<string, string>;
  focusedField: number;
  setFocusedField: (index: number) => void;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  fieldCount,
  onSubmit,
  onCancel,
  validate,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(v => ({ ...v, [field]: value }));
    setErrors(e => {
      const newErrors = { ...e };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setErrors({ _form: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

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

  return {
    values,
    setFieldValue,
    errors,
    focusedField,
    setFocusedField,
    isSubmitting,
    handleSubmit,
  };
}
