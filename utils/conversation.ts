export type Role = 'user' | 'assistant';

export interface ConversationMessage {
  role: Role;
  /** HTML tal cual se renderiza en NotebookLM (sin sanear: se sanea en la página de impresión). */
  html: string;
}

export interface Conversation {
  title: string;
  url: string;
  messages: ConversationMessage[];
}

/** Mensaje que el popup envía al content script para pedir la conversación. */
export const EXTRACT_CONVERSATION = 'extract-conversation';

/** Clave en storage.session con la que el popup pasa la conversación a la página de impresión. */
export const conversationStorageKey = (id: string) => `conversation:${id}`;

export interface ExportOptions {
  /** Si es `false`, solo se exportan las respuestas de NotebookLM. */
  includeUserMessages: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = { includeUserMessages: true };

/** Clave en storage.local con la que el popup recuerda las opciones de exportación. */
export const EXPORT_OPTIONS_KEY = 'export-options';

/** Devuelve una copia de la conversación con solo los mensajes que se van a exportar. */
export function filterConversation(
  conversation: Conversation,
  { includeUserMessages }: ExportOptions,
): Conversation {
  return {
    ...conversation,
    messages: conversation.messages.filter((m) => includeUserMessages || m.role === 'assistant'),
  };
}
