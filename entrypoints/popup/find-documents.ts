import {
  type DocumentCandidate,
  candidateFromTab,
  candidatesFromScan,
  mergeBySize,
} from '@/utils/documents';
import { scanPage } from '@/utils/injected/scan-page';
import { callVisorApi } from '@/utils/injected/unir-page';
import { topicPageUrl, topicsFromResponse, topicsPath } from '@/utils/unir';

/** Peticiones de tamaño en paralelo y tiempo máximo de cada una (RN-03, RNF-01). */
const SIZE_CONCURRENCY = 6;
const SIZE_TIMEOUT_MS = 3000;

export type DocumentsPage =
  | { kind: 'web' }
  | { kind: 'document'; url: string }
  | { kind: 'unir'; subjectId: string; topicId?: string };

/** Los documentos de la pestaña: los de la página, el documento abierto o los temas de UNIR. */
export async function findDocuments(
  tabId: number,
  page: DocumentsPage,
): Promise<DocumentCandidate[]> {
  if (page.kind === 'unir') return findTopics(tabId, page.subjectId, page.topicId);
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

/** REQ-003: los temas se piden a la API del visor desde la propia página, con su token (SUP-07). */
async function findTopics(
  tabId: number,
  subjectId: string,
  topicId?: string,
): Promise<DocumentCandidate[]> {
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

/**
 * RN-03 a RN-05: tamaños sin descargar el contenido (RNF-02). Con cada tamaño que llega se
 * fusionan los candidatos y `onSizes` recibe las direcciones que siguen en la lista.
 */
export async function checkSizes(
  candidates: DocumentCandidate[],
  onSizes: (kept: Set<string>) => void,
) {
  const sizes = new Map<string, number>();
  const queue = [...candidates];
  const worker = async () => {
    for (let candidate = queue.shift(); candidate; candidate = queue.shift()) {
      const size = await fetchSize(candidate.url);
      if (size === undefined) continue;
      sizes.set(candidate.url, size);
      onSizes(new Set(mergeBySize(candidates, sizes).map((c) => c.url)));
    }
  };
  await Promise.all(Array.from({ length: SIZE_CONCURRENCY }, worker));
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
