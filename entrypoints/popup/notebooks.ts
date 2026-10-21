import { LAST_NOTEBOOK_KEY, type Notebook } from '@/utils/sources';

/**
 * Rellena el desplegable de cuadernos y preselecciona el último usado si sigue existiendo
 * (REQ-001 RF-04 y CB-05; REQ-002 RF-12).
 */
export async function fillSelect(select: HTMLSelectElement, notebooks: Notebook[]) {
  const last = (await browser.storage.local.get(LAST_NOTEBOOK_KEY))[LAST_NOTEBOOK_KEY];
  const placeholder = new Option('Elige un cuaderno…', '');
  placeholder.disabled = true;
  select.replaceChildren(placeholder, ...notebooks.map((n) => new Option(n.title, n.id)));
  select.value = notebooks.some((n) => n.id === last) ? (last as string) : '';
}
