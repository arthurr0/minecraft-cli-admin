import React from 'react';
import { Box } from 'ink';
import type { Notice, ServerEditorModel } from '../core/types.js';
import { Panel, NoticeStrip, ShortcutStrip, FieldRow, FormShell } from '../primitives/index.js';

export interface ServerEditorScreenProps {
  model: ServerEditorModel;
  notice?: Notice;
  error?: string;
}

export function ServerEditorScreen({ model, notice, error }: ServerEditorScreenProps): React.ReactElement {
  const fields = [
    { label: 'Name', value: model.name },
    { label: 'Type', value: model.type },
    { label: 'Path', value: model.path },
    { label: 'Port', value: model.port },
  ];
  const visibleFields = model.isNew ? fields : fields.slice(1);

  return (
    <Box flexDirection="column">
      <Panel title={model.isNew ? 'Config Studio / New Server' : `Config Studio / Edit Server: ${model.originalName ?? ''}`} tone="accent">
        <FormShell
          title="Server Entry"
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
        <NoticeStrip notice={notice} idleText="Editing server entry." />
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
