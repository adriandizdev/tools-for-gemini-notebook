import { describe, expect, it } from 'vitest';
import type { DocumentToAdd } from './add-documents';
import {
  ACCESS_DENIED,
  DOWNLOAD_FAILED,
  NOT_A_DOCUMENT,
  NOT_FOUND,
  createDocumentBackend,
} from './document-backend';
import type { NotebookLmClient, Source } from './notebooklm-api';

const source = (id: string, title: string): Source => ({ id, title, youtubeId: null, ready: true });
const memoria: DocumentToAdd = { url: 'https://e.es/Memoria_2025.pdf', kind: 'pdf', name: 'Memoria 2025' };

/** Doble de NotebookLM que registra cada paso de la subida. */
function fakeClient({ uploadFails = false, renameFails = false } = {}) {
  const steps: string[] = [];
  const client: NotebookLmClient = {
    async listNotebooks() {
      return [{ id: 'nb', title: 'Prueba', sources: [source('a', 'Guía'), source('b', 'Temario')], maxSources: 300 }];
    },
    addUrls: () => Promise.reject(new Error('no se usa')),
    async deleteSources(_id, ids) {
      steps.push(`delete ${ids.join(',')}`);
    },
    async registerFile(_id, fileName) {
      steps.push(`register ${fileName}`);
      return 'src1';
    },
    async uploadFile(_id, sourceId, fileName, content) {
      steps.push(`upload ${sourceId} ${fileName} ${content.size}`);
      if (uploadFails) throw new Error('Gemini Notebook no admite la subida');
    },
    async renameSource(_id, sourceId, title) {
      steps.push(`rename ${sourceId} ${title}`);
      if (renameFails) throw new Error('fallo al renombrar');
    },
  };
  return { client, steps };
}

const respond = (response: Response) => (() => Promise.resolve(response)) as typeof fetch;
const pdf = () => new Response('%PDF-1.4', { headers: { 'content-type': 'application/pdf' } });

describe('createDocumentBackend', () => {
  it('devuelve los nombres de las fuentes y el cupo restante', async () => {
    const { client } = fakeClient();
    const state = await createDocumentBackend(client, respond(pdf())).getNotebookState('nb');
    expect([...state.titles!]).toEqual(['Guía', 'Temario']);
    expect(state.remaining).toBe(298);
  });

  it('sube el documento con la extensión y después lo renombra al nombre del listado', async () => {
    const { client, steps } = fakeClient();
    await createDocumentBackend(client, respond(pdf())).addDocument('nb', memoria);
    expect(steps).toEqual(['register Memoria 2025.pdf', 'upload src1 Memoria 2025.pdf 8', 'rename src1 Memoria 2025']);
  });

  it('usa la extensión de su tipo aunque la dirección no la tenga', async () => {
    const { client, steps } = fakeClient();
    const doc = { url: 'https://e.es/descarga?id=7', kind: 'word', name: 'Práctica' } as const;
    await createDocumentBackend(client, respond(pdf())).addDocument('nb', doc);
    expect(steps[0]).toBe('register Práctica.docx');
  });

  it('borra la fuente si la subida falla después de registrarla', async () => {
    const { client, steps } = fakeClient({ uploadFails: true });
    await expect(createDocumentBackend(client, respond(pdf())).addDocument('nb', memoria)).rejects.toThrow(
      'Gemini Notebook no admite la subida',
    );
    expect(steps.at(-1)).toBe('delete src1');
  });

  it('da el documento por añadido aunque no se pueda renombrar', async () => {
    const { client } = fakeClient({ renameFails: true });
    await expect(createDocumentBackend(client, respond(pdf())).addDocument('nb', memoria)).resolves.toBeUndefined();
  });

  describe('CB-03: documentos a los que no se puede acceder', () => {
    const cases: [string, typeof fetch, string][] = [
      ['401', respond(new Response('', { status: 401 })), ACCESS_DENIED],
      ['403', respond(new Response('', { status: 403 })), ACCESS_DENIED],
      ['404', respond(new Response('', { status: 404 })), NOT_FOUND],
      ['500', respond(new Response('', { status: 500 })), `${DOWNLOAD_FAILED} (HTTP 500)`],
      [
        'una página de inicio de sesión',
        respond(new Response('<html>', { headers: { 'content-type': 'text/html' } })),
        NOT_A_DOCUMENT,
      ],
      ['un fallo de red', () => Promise.reject(new TypeError('Failed to fetch')), DOWNLOAD_FAILED],
    ];

    it.each(cases)('%s: falla con su motivo sin tocar el cuaderno', async (_name, fetchFn, reason) => {
      const { client, steps } = fakeClient();
      await expect(createDocumentBackend(client, fetchFn).addDocument('nb', memoria)).rejects.toThrow(reason);
      expect(steps).toEqual([]);
    });
  });

  it('REQ-003: descarga de la dirección que da `resolveUrl`', async () => {
    let downloaded: RequestInfo | URL | undefined;
    const fetchFn = ((input: RequestInfo | URL) => {
      downloaded = input;
      return Promise.resolve(pdf());
    }) as typeof fetch;
    const resolveUrl = () => Promise.resolve('https://cms.unir.net/file/1/esl-ES');
    await createDocumentBackend(fakeClient().client, fetchFn, resolveUrl).addDocument('nb', memoria);
    expect(downloaded).toBe('https://cms.unir.net/file/1/esl-ES');
  });

  it('REQ-003, CB-03: si no hay dirección, falla con su motivo sin tocar el cuaderno', async () => {
    const { client, steps } = fakeClient();
    const resolveUrl = () => Promise.reject(new Error('la sesión del campus ha caducado'));
    await expect(createDocumentBackend(client, respond(pdf()), resolveUrl).addDocument('nb', memoria)).rejects.toThrow(
      'la sesión del campus ha caducado',
    );
    expect(steps).toEqual([]);
  });

  it('descarga sin las cookies del usuario', async () => {
    let init: RequestInit | undefined;
    const fetchFn = ((_input: RequestInfo | URL, options?: RequestInit) => {
      init = options;
      return Promise.resolve(pdf());
    }) as typeof fetch;
    await createDocumentBackend(fakeClient().client, fetchFn).addDocument('nb', memoria);
    expect(init?.credentials).toBe('omit');
  });
});
