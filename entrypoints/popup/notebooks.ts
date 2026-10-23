import { getLastNotebook } from '@/utils/accounts';
import { NO_NOTEBOOKS } from '@/utils/messages';
import type { Account } from '@/utils/notebooklm-api';
import {
  LIST_NOTEBOOKS,
  type ListNotebooksRequest,
  type ListNotebooksResponse,
  type Notebook,
} from '@/utils/sources';
import type { AccountSession } from './accounts';
import type { StatusKind } from './main';

/**
 * Pide los cuadernos de `account` tal como están en NotebookLM en ese momento (REQ-001 RF-18,
 * RF-20; REQ-002 RF-23; REQ-004 RF-07). Mientras llegan, el desplegable lo indica. Si entretanto
 * cambia la cuenta activa, la respuesta se descarta y devuelve `undefined`.
 */
export async function loadNotebooks(
  select: HTMLSelectElement,
  accounts: AccountSession,
  account: Account,
  showStatus: (message: string, kind?: StatusKind) => void,
): Promise<Notebook[] | undefined> {
  const stale = () => accounts.current !== account;
  select.disabled = true;
  select.replaceChildren(new Option('Cargando cuadernos…', ''));
  try {
    const request: ListNotebooksRequest = { type: LIST_NOTEBOOKS, account };
    const response: ListNotebooksResponse = await browser.runtime.sendMessage(request);
    if (stale()) return undefined;
    if (!response.ok) {
      // RF-14, RF-15: el aviso lo pone `signedOut`.
      return fail(select, () =>
        response.loggedOut ? accounts.signedOut() : showStatus(response.message),
      );
    }
    if (!response.notebooks.length) return fail(select, () => showStatus(NO_NOTEBOOKS));
    const last = await getLastNotebook(account.email).catch(() => undefined);
    if (stale()) return undefined;
    fillSelect(select, response.notebooks, last);
    return response.notebooks;
  } catch (error) {
    if (stale()) return undefined;
    return fail(select, () => showStatus(error instanceof Error ? error.message : String(error)));
  } finally {
    if (!stale()) select.disabled = false;
  }
}

function fail(select: HTMLSelectElement, report: () => void): Notebook[] {
  select.replaceChildren();
  report();
  return [];
}

/**
 * Rellena el desplegable de cuadernos y preselecciona el último usado en esa cuenta si sigue
 * existiendo (REQ-001 RF-19 y CB-05; REQ-004 RF-12, RN-02 y CB-06).
 */
function fillSelect(select: HTMLSelectElement, notebooks: Notebook[], last: string | undefined) {
  const placeholder = new Option('Elige un cuaderno…', '');
  placeholder.disabled = true;
  select.replaceChildren(placeholder, ...notebooks.map((n) => new Option(n.title, n.id)));
  select.value = last && notebooks.some((n) => n.id === last) ? last : '';
}
