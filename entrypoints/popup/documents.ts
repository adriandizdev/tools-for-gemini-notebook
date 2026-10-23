import type { DocumentStatus } from '@/utils/add-documents';
import { proposedName, sourceName } from '@/utils/document-name';
import {
  type DocumentCandidate,
  type DocumentKind,
  candidateFromTab,
  candidatesFromScan,
  mergeBySize,
} from '@/utils/documents';
import { ALL_WEBS } from '@/utils/domains';
import { NO_ACTIONS, NO_NOTEBOOKS, SCANNING } from '@/utils/messages';
import { scanPage } from '@/utils/scan-page';
import { topicPageUrl, topicsFromResponse, topicsPath } from '@/utils/unir';
import { callVisorApi } from '@/utils/unir-page';
import {
  ADD_DOCUMENTS_PORT,
  type AddDocumentsEvent,
  type AddDocumentsRequest,
  LIST_NOTEBOOKS,
  type ListNotebooksResponse,
  type Notebook,
} from '@/utils/sources';
import type { StatusKind } from './main';
import { fillSelect } from './notebooks';

/** Peticiones de tamaño en paralelo y tiempo máximo de cada una (RN-03, RNF-01). */
const SIZE_CONCURRENCY = 6;
const SIZE_TIMEOUT_MS = 3000;

const KIND_LABEL: Record<DocumentKind, string> = {
  pdf: 'PDF',
  word: 'Word',
  powerpoint: 'PowerPoint',
};
const STATE_LABEL = { adding: 'Añadiendo…', added: 'Añadido' } as const;

interface Row {
  candidate: DocumentCandidate;
  /** Nombre que se usa si el usuario deja el suyo vacío (RN-07; REQ-003, RN-03). */
  proposed: string;
  item: HTMLLIElement;
  checkbox: HTMLInputElement;
  name: HTMLInputElement;
  add: HTMLButtonElement;
  state: HTMLParagraphElement;
}

type DocumentsPage =
  | { kind: 'web' }
  | { kind: 'document'; url: string }
  | { kind: 'unir'; subjectId: string; topicId?: string };

/**
 * Acción "añadir documentos de la página" en cualquier web salvo NotebookLM y YouTube (REQ-002).
 * En el visor de UNIR, el listado son los temas de la asignatura (REQ-003).
 */
export function setupDocuments(
  tabId: number,
  page: DocumentsPage,
  showStatus: (message: string, kind?: StatusKind) => void,
) {
  const grant = document.querySelector<HTMLButtonElement>('#grant')!;
  const panel = document.querySelector<HTMLElement>('#documents')!;
  const select = document.querySelector<HTMLSelectElement>('#documents-notebook')!;
  const scanStatus = document.querySelector<HTMLParagraphElement>('#scan-status')!;
  const list = document.querySelector<HTMLUListElement>('#document-list')!;
  const addSelected = document.querySelector<HTMLButtonElement>('#add-selected')!;

  const rows = new Map<string, Row>();
  let notebooks: Notebook[] = [];
  let busy = false;
  /** Botón que lanzó la operación en curso; muestra el spinner. */
  let trigger: HTMLButtonElement | undefined;

  const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

  function setBusy(value: boolean, button?: HTMLButtonElement) {
    busy = value;
    if (trigger) trigger.ariaBusy = null;
    trigger = value ? button : undefined;
    if (trigger) trigger.ariaBusy = 'true';
    updateButtons();
  }

  function updateButtons() {
    const ready = !busy && Boolean(select.value);
    for (const row of rows.values()) {
      row.add.disabled = !ready;
      row.checkbox.disabled = busy;
    }
    // RF-11: solo con al menos un documento seleccionado.
    addSelected.disabled = !ready || ![...rows.values()].some((row) => row.checkbox.checked);
  }

  function setState(row: Row, status: DocumentStatus | null) {
    row.state.className = `document-state ${status?.state ?? ''}`;
    if (!status) row.state.textContent = '';
    else if (status.state === 'adding' || status.state === 'added')
      row.state.textContent = STATE_LABEL[status.state];
    else row.state.textContent = status.message;
    if (status?.state === 'added') row.checkbox.checked = false;
  }

  function renderRow(candidate: DocumentCandidate): Row {
    const item = document.createElement('li');
    item.className = 'document';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', 'Seleccionar documento');
    // REQ-003, RF-06: los temas aparecen todos seleccionados.
    checkbox.checked = candidate.unirTopicId !== undefined;
    const proposed = candidate.title ?? proposedName(candidate.url);
    const name = document.createElement('input');
    name.type = 'text';
    name.value = proposed;
    name.placeholder = proposed;
    name.title = candidate.url;
    const add = document.createElement('button');
    add.className = 'ghost';
    add.textContent = 'Añadir';
    const state = document.createElement('p');
    state.className = 'document-state';
    const meta = document.createElement('p');
    meta.className = 'document-meta';
    meta.textContent =
      candidate.unirTopicId === undefined
        ? `${KIND_LABEL[candidate.kind]} · ${candidate.fileName}`
        : KIND_LABEL.pdf;
    item.append(checkbox, name, add, meta, state);

    const row: Row = { candidate, proposed, item, checkbox, name, add, state };
    checkbox.addEventListener('change', updateButtons);
    add.addEventListener('click', () => addDocuments([row], add));
    return row;
  }

  /** Abre el puerto con el background y va actualizando el estado de cada fila (RF-16). */
  function addDocuments(toAdd: Row[], button: HTMLButtonElement) {
    const notebook = notebooks.find((n) => n.id === select.value);
    if (!notebook || !toAdd.length) return;
    setBusy(true, button);
    showStatus('');
    for (const row of toAdd) setState(row, null);

    const port = browser.runtime.connect({ name: ADD_DOCUMENTS_PORT });
    port.onMessage.addListener((event: AddDocumentsEvent) => {
      if (event.type === 'status') {
        const row = rows.get(event.url);
        if (row) setState(row, event.status);
        return;
      }
      showStatus(event.response.message, event.response.ok ? 'success' : 'error');
      setBusy(false);
      port.disconnect();
    });
    port.onDisconnect.addListener(() => {
      if (busy) setBusy(false);
    });
    const request: AddDocumentsRequest = {
      notebook,
      documents: toAdd.map(({ candidate, proposed, name }) => ({
        url: candidate.url,
        kind: candidate.kind,
        name: sourceName(name.value, proposed),
        ...(candidate.unirTopicId === undefined
          ? {}
          : { unirTopic: { tabId, topicId: candidate.unirTopicId } }),
      })),
    };
    port.postMessage(request);
  }

  async function loadNotebooks() {
    try {
      const response: ListNotebooksResponse = await browser.runtime.sendMessage({
        type: LIST_NOTEBOOKS,
      });
      if (!response.ok) return showStatus(response.message);
      notebooks = response.notebooks;
      if (!notebooks.length) return showStatus(NO_NOTEBOOKS);
      await fillSelect(select, notebooks);
      updateButtons();
    } catch (error) {
      showStatus(errorText(error));
    }
  }

  /** REQ-003: los temas se piden a la API del visor desde la propia página, con su token (SUP-07). */
  async function findTopics(subjectId: string, topicId?: string): Promise<DocumentCandidate[]> {
    try {
      const [injection] = await browser.scripting.executeScript({
        target: { tabId },
        func: callVisorApi,
        args: ['GET', topicsPath(subjectId)],
      });
      const result = injection?.result;
      if (!result || result.status < 200 || result.status >= 300) return []; // SUP-08
      return topicsFromResponse(result.body, topicId).map((topic) => ({
        url: topicPageUrl(subjectId, topic.topicId),
        fileName: topic.title,
        kind: 'pdf',
        title: topic.title,
        unirTopicId: topic.topicId,
      }));
    } catch {
      return [];
    }
  }

  async function findDocuments(): Promise<DocumentCandidate[]> {
    if (page.kind === 'unir') return findTopics(page.subjectId, page.topicId);
    if (page.kind === 'document') {
      const candidate = candidateFromTab(page.url);
      return candidate ? [candidate] : [];
    }
    try {
      const [injection] = await browser.scripting.executeScript({
        target: { tabId },
        func: scanPage,
      });
      return candidatesFromScan(injection?.result ?? []);
    } catch {
      // Páginas en las que el navegador no deja buscar (Chrome Web Store, visores internos…).
      return [];
    }
  }

  /** RN-03 a RN-05: tamaños sin descargar el contenido (RNF-02); se fusionan según llegan. */
  async function checkSizes(candidates: DocumentCandidate[]) {
    const sizes = new Map<string, number>();
    const queue = [...candidates];
    const worker = async () => {
      for (let candidate = queue.shift(); candidate; candidate = queue.shift()) {
        const size = await fetchSize(candidate.url);
        if (size === undefined) continue;
        sizes.set(candidate.url, size);
        const kept = new Set(mergeBySize(candidates, sizes).map((c) => c.url));
        for (const [url, row] of rows) {
          // Solo se quitan filas que el usuario aún no ha tocado.
          if (!kept.has(url) && !row.state.textContent && !row.checkbox.checked) {
            row.item.remove();
            rows.delete(url);
          }
        }
      }
    };
    await Promise.all(Array.from({ length: SIZE_CONCURRENCY }, worker));
  }

  async function scan() {
    scanStatus.textContent = SCANNING;
    scanStatus.hidden = false;
    panel.ariaBusy = 'true';
    const candidates = await findDocuments();
    // RF-05, RNF-01: se muestran ya, sin esperar a los tamaños.
    for (const candidate of candidates) {
      const row = renderRow(candidate);
      rows.set(candidate.url, row);
      list.append(row.item);
    }
    updateButtons();
    // Los temas de UNIR no tienen dirección de descarga hasta que se piden (REQ-003).
    if (page.kind !== 'unir') await checkSizes(candidates);
    scanStatus.hidden = true;
    panel.ariaBusy = null;
    if (rows.size) return;
    // CB-08
    addSelected.hidden = true;
    document.body.classList.add('empty');
    showStatus(NO_ACTIONS, 'info');
  }

  async function run() {
    grant.hidden = true;
    panel.hidden = false;
    void loadNotebooks();
    await scan();
  }

  async function requestPermission() {
    let granted = false;
    try {
      granted = await browser.permissions.request({ origins: ALL_WEBS });
    } catch (error) {
      showStatus(errorText(error));
    }
    // CB-09: si lo deniega, el botón sigue ahí.
    if (granted) await run();
  }

  select.addEventListener('change', updateButtons);
  addSelected.addEventListener('click', () =>
    addDocuments(
      [...rows.values()].filter((row) => row.checkbox.checked),
      addSelected,
    ),
  );
  grant.addEventListener('click', () => void requestPermission());

  void browser.permissions
    .contains({ origins: ALL_WEBS })
    .then((granted) => {
      // RF-21: sin permiso, solo se ofrece pedirlo.
      if (granted) return run();
      grant.hidden = false;
    })
    .catch((error: unknown) => showStatus(errorText(error)));
}

async function fetchSize(url: string): Promise<number | undefined> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      credentials: 'omit',
      signal: AbortSignal.timeout(SIZE_TIMEOUT_MS),
    });
    const length = Number(response.headers.get('content-length'));
    return response.ok && length > 0 ? length : undefined;
  } catch {
    return undefined;
  }
}
