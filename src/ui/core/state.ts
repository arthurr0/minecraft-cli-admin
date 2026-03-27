import type { DeleteIntent, EventRecord, Notice, ServerEditorModel, TypeEditorModel } from './types.js';

export type Screen =
  | 'overview'
  | 'config-home'
  | 'config-servers'
  | 'config-server-editor'
  | 'config-types'
  | 'config-type-editor'
  | 'confirm-delete';

export interface AppState {
  screen: Screen;
  selectedServerName?: string;
  selectedConfigServer: number;
  selectedConfigType: number;
  processing: boolean;
  notice?: Notice;
  events: EventRecord[];
  deleteIntent?: DeleteIntent;
  serverEditor?: ServerEditorModel;
  typeEditor?: TypeEditorModel;
}

export type AppAction =
  | { type: 'setScreen'; screen: Screen }
  | { type: 'setSelectedServerName'; name?: string }
  | { type: 'setSelectedConfigServer'; index: number }
  | { type: 'setSelectedConfigType'; index: number }
  | { type: 'setProcessing'; value: boolean }
  | { type: 'setNotice'; notice?: Notice }
  | { type: 'pushEvent'; event: EventRecord; limit?: number }
  | { type: 'setDeleteIntent'; intent?: DeleteIntent }
  | { type: 'openServerEditor'; model: ServerEditorModel }
  | { type: 'updateServerEditor'; patch: Partial<ServerEditorModel> }
  | { type: 'clearServerEditor' }
  | { type: 'openTypeEditor'; model: TypeEditorModel }
  | { type: 'updateTypeEditor'; patch: Partial<TypeEditorModel> }
  | { type: 'clearTypeEditor' };

export const initialState: AppState = {
  screen: 'overview',
  selectedServerName: undefined,
  selectedConfigServer: 0,
  selectedConfigType: 0,
  processing: false,
  notice: undefined,
  events: [],
  deleteIntent: undefined,
  serverEditor: undefined,
  typeEditor: undefined,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setScreen':
      return {
        ...state,
        screen: action.screen,
      };
    case 'setSelectedServerName':
      return {
        ...state,
        selectedServerName: action.name,
      };
    case 'setSelectedConfigServer':
      return {
        ...state,
        selectedConfigServer: Math.max(0, action.index),
      };
    case 'setSelectedConfigType':
      return {
        ...state,
        selectedConfigType: Math.max(0, action.index),
      };
    case 'setProcessing':
      return {
        ...state,
        processing: action.value,
      };
    case 'setNotice':
      return {
        ...state,
        notice: action.notice,
      };
    case 'pushEvent': {
      const limit = action.limit ?? 8;
      return {
        ...state,
        events: [action.event, ...state.events].slice(0, limit),
      };
    }
    case 'setDeleteIntent':
      return {
        ...state,
        deleteIntent: action.intent,
      };
    case 'openServerEditor':
      return {
        ...state,
        serverEditor: action.model,
        screen: 'config-server-editor',
      };
    case 'updateServerEditor':
      return {
        ...state,
        serverEditor: state.serverEditor
          ? {
              ...state.serverEditor,
              ...action.patch,
            }
          : state.serverEditor,
      };
    case 'clearServerEditor':
      return {
        ...state,
        serverEditor: undefined,
      };
    case 'openTypeEditor':
      return {
        ...state,
        typeEditor: action.model,
        screen: 'config-type-editor',
      };
    case 'updateTypeEditor':
      return {
        ...state,
        typeEditor: state.typeEditor
          ? {
              ...state.typeEditor,
              ...action.patch,
            }
          : state.typeEditor,
      };
    case 'clearTypeEditor':
      return {
        ...state,
        typeEditor: undefined,
      };
    default:
      return state;
  }
}
