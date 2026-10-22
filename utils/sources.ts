/** Tipos y mensajes compartidos entre el popup y el background para añadir fuentes (REQ-001 y REQ-002). */

import type { DocumentStatus, DocumentToAdd } from './add-documents';

export interface Notebook {
  id: string;
  title: string;
}

/** Lo que se quiere añadir: el vídeo o la lista de la pestaña activa. */
export type SourceTarget =
  { kind: 'video'; videoId: string } | { kind: 'playlist'; listId: string };

/** Mensaje del popup al background para obtener los cuadernos tal como están ahora (RF-09). */
export const LIST_NOTEBOOKS = 'list-notebooks';
/** Mensaje del popup al background para añadir `target` al cuaderno elegido. */
export const ADD_TO_NOTEBOOK = 'add-to-notebook';

export interface AddToNotebookRequest {
  type: typeof ADD_TO_NOTEBOOK;
  notebook: Notebook;
  target: SourceTarget;
}

export type ListNotebooksResponse =
  { ok: true; notebooks: Notebook[] } | { ok: false; message: string };

export interface AddToNotebookResponse {
  ok: boolean;
  message: string;
  /** Si se añadió al menos una fuente: solo entonces se recuerda el cuaderno (RF-04). */
  addedAny: boolean;
}

/** Clave en storage.local con el id del último cuaderno al que se añadió una fuente (RN-10). */
export const LAST_NOTEBOOK_KEY = 'last-notebook';

/**
 * Nombre del puerto por el que el popup pide añadir documentos (REQ-002). Es un puerto y no un
 * mensaje para ir recibiendo el estado de cada documento; si el popup se cierra, el background
 * termina igualmente (RN-16).
 */
export const ADD_DOCUMENTS_PORT = 'add-documents';

export interface AddDocumentsRequest {
  notebook: Notebook;
  documents: DocumentToAdd[];
}

export type AddDocumentsEvent =
  | { type: 'status'; url: string; status: DocumentStatus }
  | { type: 'done'; response: AddToNotebookResponse };
