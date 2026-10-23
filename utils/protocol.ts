/** Protocolo entre el popup y el background para añadir fuentes: tipos y nombres de los mensajes (REQ-001 a REQ-004). */

import type { DocumentStatus, DocumentToAdd } from './add-documents';
import type { Account } from './notebooklm-api';

export interface Notebook {
  id: string;
  title: string;
}

/** Lo que se quiere añadir: el vídeo o la lista de la pestaña activa. */
export type SourceTarget =
  { kind: 'video'; videoId: string } | { kind: 'playlist'; listId: string };

/** Mensaje del popup al background para obtener las cuentas con la sesión iniciada (REQ-004, RF-01). */
export const LIST_ACCOUNTS = 'list-accounts';
/** Mensaje del popup al background para obtener los cuadernos de la cuenta tal como están ahora (RF-18). */
export const LIST_NOTEBOOKS = 'list-notebooks';
/** Mensaje del popup al background para añadir `target` al cuaderno elegido. */
export const ADD_TO_NOTEBOOK = 'add-to-notebook';

export type ListAccountsResponse =
  { ok: true; accounts: Account[] } | { ok: false; message: string };

export interface ListNotebooksRequest {
  type: typeof LIST_NOTEBOOKS;
  account: Account;
}

export interface AddToNotebookRequest {
  type: typeof ADD_TO_NOTEBOOK;
  /** La cuenta en la que empezó la importación, que es en la que termina (REQ-004, RN-05). */
  account: Account;
  notebook: Notebook;
  target: SourceTarget;
}

/** `loggedOut`: la cuenta ya no tiene la sesión iniciada; el popup retira las acciones (REQ-004, RF-14). */
export type ListNotebooksResponse =
  { ok: true; notebooks: Notebook[] } | { ok: false; message: string; loggedOut?: boolean };

export interface AddToNotebookResponse {
  ok: boolean;
  message: string;
  /** Si se añadió al menos una fuente: solo entonces se recuerda el cuaderno (RF-19). */
  addedAny: boolean;
  loggedOut?: boolean;
}

/**
 * Nombre del puerto por el que el popup pide añadir documentos (REQ-002). Es un puerto y no un
 * mensaje para ir recibiendo el estado de cada documento; si el popup se cierra, el background
 * termina igualmente (RN-16).
 */
export const ADD_DOCUMENTS_PORT = 'add-documents';

export interface AddDocumentsRequest {
  account: Account;
  notebook: Notebook;
  documents: DocumentToAdd[];
}

export type AddDocumentsEvent =
  | { type: 'status'; url: string; status: DocumentStatus }
  | { type: 'done'; response: AddToNotebookResponse };
