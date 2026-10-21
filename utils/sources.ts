/** Tipos y mensajes compartidos entre el popup y el background para añadir fuentes (REQ-001). */

export interface Notebook {
  id: string;
  title: string;
}

/** Lo que se quiere añadir: el vídeo o la lista de la pestaña activa. */
export type SourceTarget = { kind: 'video'; videoId: string } | { kind: 'playlist'; listId: string };

/** Mensaje del popup al background para obtener los cuadernos tal como están ahora (RF-09). */
export const LIST_NOTEBOOKS = 'list-notebooks';
/** Mensaje del popup al background para añadir `target` al cuaderno elegido. */
export const ADD_TO_NOTEBOOK = 'add-to-notebook';

export interface AddToNotebookRequest {
  type: typeof ADD_TO_NOTEBOOK;
  notebook: Notebook;
  target: SourceTarget;
}

export type ListNotebooksResponse = { ok: true; notebooks: Notebook[] } | { ok: false; message: string };

export interface AddToNotebookResponse {
  ok: boolean;
  message: string;
  /** Si se añadió al menos una fuente: solo entonces se recuerda el cuaderno (RF-04). */
  addedAny: boolean;
}

/** Clave en storage.local con el id del último cuaderno al que se añadió una fuente (RN-10). */
export const LAST_NOTEBOOK_KEY = 'last-notebook';
