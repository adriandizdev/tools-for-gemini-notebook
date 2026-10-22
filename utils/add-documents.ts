import { NOTEBOOK_FULL } from './add-sources';
import type { DocumentKind } from './documents';
import * as m from './messages';
import type { AddToNotebookResponse, Notebook } from './sources';

/** Estado del cuaderno destino antes de añadir. */
export interface DocumentNotebookState {
  /** Nombres de las fuentes que ya tiene (RN-15); `null` si Gemini Notebook no lo permite saber (SUP-04). */
  titles: Set<string> | null;
  /** Fuentes que aún admite el cuaderno (CB-01); `null` si no se sabe. */
  remaining: number | null;
}

/** Un documento del listado tal como se va a añadir. */
export interface DocumentToAdd {
  url: string;
  kind: DocumentKind;
  /** Nombre de la fuente: el editado, o el propuesto si se dejó vacío (RF-15, RN-07). */
  name: string;
  /** Solo los temas del visor de UNIR: el PDF se pide al visor desde su pestaña (REQ-003). */
  unirTopic?: { tabId: number; topicId: string };
}

/** Estado de cada documento del listado (RF-16). */
export type DocumentStatus =
  | { state: 'adding' }
  | { state: 'added' }
  | { state: 'present'; message: string }
  | { state: 'failed'; message: string };

/** Lo que la orquestación necesita de NotebookLM y de la web; en los tests se sustituye por un doble. */
export interface DocumentBackend {
  getNotebookState(notebookId: string): Promise<DocumentNotebookState>;
  /** Descarga el documento y lo añade como fuente. Si no puede, lanza un error con el motivo. */
  addDocument(notebookId: string, document: DocumentToAdd): Promise<void>;
}

/**
 * Añade uno o varios documentos al cuaderno (RF-13, RF-14) e informa del estado de cada uno con
 * `onStatus` según avanza. Un solo documento usa los mensajes M-12, M-15 y M-17; varios, M-13, M-14,
 * M-16 y M-18.
 */
export async function addDocuments(
  backend: DocumentBackend,
  notebook: Notebook,
  documents: DocumentToAdd[],
  onStatus: (url: string, status: DocumentStatus) => void,
): Promise<AddToNotebookResponse> {
  const single = documents.length === 1;
  const { titles, remaining } = await backend.getNotebookState(notebook.id);

  // RN-15: ya presente si el cuaderno tiene una fuente con el mismo nombre. Dos documentos de la
  // selección con el mismo nombre también chocan entre sí.
  const names = new Set(titles);
  const present: DocumentToAdd[] = [];
  const pending: DocumentToAdd[] = [];
  for (const document of documents) {
    if (titles && names.has(document.name)) {
      present.push(document);
    } else {
      pending.push(document);
      names.add(document.name);
    }
  }

  // RN-08: la selección entera o nada; solo cuentan los documentos nuevos (SUP-03).
  if (remaining !== null && pending.length > remaining) {
    // Un solo documento en un cuaderno lleno es un rechazo más, como en REQ-001 (RN-11).
    const message = single
      ? m.documentRejected(NOTEBOOK_FULL)
      : m.documentsNoRoom(pending.length, notebook.title, remaining);
    if (single) onStatus(pending[0]!.url, { state: 'failed', message });
    return { ok: false, addedAny: false, message };
  }

  const presentMessage = m.documentAlreadyPresent(notebook.title);
  for (const document of present)
    onStatus(document.url, { state: 'present', message: presentMessage });

  let added = 0;
  const reasons: string[] = [];
  // De uno en uno: así el estado de cada fila avanza a la vez que el trabajo real.
  for (const document of pending) {
    onStatus(document.url, { state: 'adding' });
    try {
      await backend.addDocument(notebook.id, document);
      added++;
      onStatus(document.url, { state: 'added' });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      reasons.push(reason);
      onStatus(document.url, { state: 'failed', message: m.documentRejected(reason) });
    }
  }

  if (single) {
    if (present.length) return { ok: true, addedAny: false, message: presentMessage };
    return added
      ? { ok: true, addedAny: true, message: m.documentAdded(notebook.title) }
      : { ok: false, addedAny: false, message: m.documentRejected(reasons[0]!) };
  }
  if (pending.length && !added) {
    return { ok: false, addedAny: false, message: m.documentsNoneAdded(reasons[0]!) };
  }
  if (!present.length && !reasons.length) {
    return { ok: true, addedAny: true, message: m.documentsAdded(added, notebook.title) };
  }
  return {
    ok: true,
    addedAny: added > 0,
    message: m.documentsPartial(
      added,
      documents.length,
      notebook.title,
      present.length,
      reasons.length,
    ),
  };
}
