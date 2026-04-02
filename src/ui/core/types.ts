export type NoticeLevel = 'info' | 'success' | 'error';

export interface Notice {
  level: NoticeLevel;
  text: string;
}

export interface EventRecord {
  timestamp: string;
  level: NoticeLevel;
  text: string;
}

export interface DeleteIntent {
  entity: 'server' | 'type';
  name: string;
  message: string;
}

export interface ServerEditorModel {
  isNew: boolean;
  originalName?: string;
  name: string;
  type: string;
  path: string;
  port: string;
  focus: number;
}

export interface TypeEditorModel {
  isNew: boolean;
  originalName?: string;
  name: string;
  memory: string;
  minMemory: string;
  jvmFlags: string;
  focus: number;
}

export interface CommandState {
  command: string;
  mode: boolean;
}
