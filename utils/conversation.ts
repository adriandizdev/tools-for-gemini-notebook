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
