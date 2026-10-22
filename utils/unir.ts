/** Temas del visor de UNIR (REQ-003). La API se verificó contra la página real el 2026-10-22. */

import { dig } from './dig';
import { UNIR_VISOR_HOST } from './domains';
import type { VisorApiResult } from './unir-page';

/** Motivos que se muestran en M-17 cuando el visor no entrega el PDF de un tema (CB-03). */
export const CAMPUS_SESSION_EXPIRED = 'la sesión del campus ha caducado';
export const TOPIC_NOT_DELIVERED = 'el visor no ha entregado el tema';
export const VISOR_TAB_CLOSED = 'se ha cerrado la pestaña del visor';

export interface VisorPage {
  subjectId: string;
  /** Solo en la página de un tema (RF-02). */
  topicId?: string;
}

export interface UnirTopic {
  topicId: string;
  title: string;
}

/**
 * `/asignaturas/{asignatura}/mis-temas` (RF-01) y `/asignaturas/{asignatura}/mis-temas/{tema}`
 * (RF-02). Las demás páginas del visor no tienen acción (SUP-02).
 */
export function parseVisorPath(pathname: string): VisorPage | null {
  const match = /^\/asignaturas\/([^/]+)\/mis-temas(?:\/([^/]+))?\/?$/.exec(pathname);
  if (!match) return null;
  const [, subjectId, topicId] = match;
  return topicId ? { subjectId: subjectId!, topicId } : { subjectId: subjectId! };
}

export const topicsPath = (subjectId: string) =>
  `/api/v3/subjects/${encodeURIComponent(subjectId)}/user-topics`;
export const topicPdfPath = (topicId: string) =>
  `/api/v1/topics/${encodeURIComponent(topicId)}/download`;

/** Dirección de la página del tema: identifica el tema en el listado y en los estados. */
export const topicPageUrl = (subjectId: string, topicId: string) =>
  `https://${UNIR_VISOR_HOST}/asignaturas/${subjectId}/mis-temas/${topicId}`;

/**
 * Temas de la respuesta de `user-topics`, en el orden del visor (SUP-03); solo `topicId` si se
 * indica (RF-02). Si la respuesta no es la esperada, ninguno (SUP-08).
 */
export function topicsFromResponse(body: unknown, topicId?: string): UnirTopic[] {
  const topics = dig(body, 'topics');
  if (!Array.isArray(topics)) return [];
  const result: UnirTopic[] = [];
  for (const topic of topics) {
    const id = dig(topic, 'topicId');
    const title = dig(topic, 'title');
    if (
      (typeof id !== 'string' && typeof id !== 'number') ||
      typeof title !== 'string' ||
      !title.trim()
    )
      continue;
    result.push({ topicId: String(id), title: title.trim() });
  }
  return topicId === undefined ? result : result.filter((topic) => topic.topicId === topicId);
}

/** Dirección del PDF de la respuesta de `download`, o un error con el motivo de M-17 (CB-03). */
export function topicPdfUrl({ status, body }: VisorApiResult): string {
  if (status === 401 || status === 403) throw new Error(CAMPUS_SESSION_EXPIRED);
  const url = dig(body, 'downloadUrl');
  if (status < 200 || status >= 300 || typeof url !== 'string' || !url)
    throw new Error(TOPIC_NOT_DELIVERED);
  return url;
}
