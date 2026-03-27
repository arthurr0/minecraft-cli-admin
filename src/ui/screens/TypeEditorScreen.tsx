import React from 'react';
import { Box } from 'ink';
import type { Notice, TypeEditorModel } from '../core/types.js';
import { Panel, NoticeStrip, ShortcutStrip, FieldRow, FormShell } from '../primitives/index.js';

export interface TypeEditorScreenProps {
  model: TypeEditorModel;
  notice?: Notice;
  error?: string;
}

export function TypeEditorScreen({ model, notice, error }: TypeEditorScreenProps): React.ReactElement {
  const fields = [
    { label: 'Name', value: model.name },
    { label: 'Memory', value: model.memory },
    { label: 'Min Memory', value: model.minMemory },
    { label: 'JVM Flags', value: model.jvmFlags },
  ];
  const visibleFields = model.isNew ? fields : fields.slice(1);

  return (
    <Box flexDirection="column">
      <Panel title={model.isNew ? 'Config Studio / New Type' : `Config Studio / Edit Type: ${model.originalName ?? ''}`} tone="accent">
        <FormShell
          title="Type Profile"
          error={error}
          help="Type to edit value. TAB cycles fields. BACKSPACE deletes. CTRL+S saves. ESC cancels."
        >
          {visibleFields.map((field, index) => (
            <FieldRow
              key={field.label}
              label={field.label}
              value={field.value}
              focused={model.focus === index}
            />
          ))}
        </FormShell>
      </Panel>

      <Box marginTop={1}>
        <NoticeStrip notice={notice} idleText="Editing type profile." />
      </Box>

      <Box marginTop={1}>
        <ShortcutStrip
          items={[
            { key: 'TAB', label: 'Next field' },
            { key: 'SHIFT+TAB', label: 'Previous field' },
            { key: 'CTRL+S', label: 'Save' },
            { key: 'ESC', label: 'Cancel' },
          ]}
        />
      </Box>
    </Box>
  );
}
