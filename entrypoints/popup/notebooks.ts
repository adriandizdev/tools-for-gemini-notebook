import { NO_NOTEBOOKS } from '@/utils/messages';
import {
  LAST_NOTEBOOK_KEY,
  LIST_NOTEBOOKS,
  type ListNotebooksResponse,
  type Notebook,
} from '@/utils/sources';
import type { StatusKind } from './main';

/**
 * Pide los cuadernos al abrir el panel, tal como están en NotebookLM en ese momento
 * (REQ-001 RF-17, RF-18; REQ-002 RF-12). Mientras llegan, el desplegable lo indica.
 */
export async function loadNotebooks(
  select: HTMLSelectElement,
  showStatus: (message: string, kind?: StatusKind) => void,
): Promise<Notebook[]> {
  select.disabled = true;
  select.replaceChildren(new Option('Cargando cuadernos…', ''));
  try {
    const response: ListNotebooksResponse = await browser.runtime.sendMessage({
      type: LIST_NOTEBOOKS,
    });
    if (!response.ok) return fail(select, () => showStatus(response.message));
    if (!response.notebooks.length) return fail(select, () => showStatus(NO_NOTEBOOKS));
    await fillSelect(select, response.notebooks);
    return response.notebooks;
  } catch (error) {
    return fail(select, () => showStatus(error instanceof Error ? error.message : String(error)));
  } finally {
    select.disabled = false;
  }
}

function fail(select: HTMLSelectElement, report: () => void): Notebook[] {
  select.replaceChildren();
  report();
  return [];
}

/**
 * Rellena el desplegable de cuadernos y preselecciona el último usado si sigue existiendo
 * (REQ-001 RF-04 y CB-05; REQ-002 RF-12).
 */
async function fillSelect(select: HTMLSelectElement, notebooks: Notebook[]) {
  const last = (await browser.storage.local.get(LAST_NOTEBOOK_KEY))[LAST_NOTEBOOK_KEY];
  const placeholder = new Option('Elige un cuaderno…', '');
  placeholder.disabled = true;
  select.replaceChildren(placeholder, ...notebooks.map((n) => new Option(n.title, n.id)));
  select.value = notebooks.some((n) => n.id === last) ? (last as string) : '';
}
