import { describe, expect, it } from 'vitest';
import { NOTEBOOK_FULL } from './add-sources';
import {
  type DocumentBackend,
  type DocumentStatus,
  type DocumentToAdd,
  addDocuments,
} from './add-documents';
import * as m from './strings';
import { NotLoggedInError } from './notebooklm-api';

const notebook = { id: 'nb1', title: 'Física' };

/** Doble de NotebookLM y de la web: guarda los documentos añadidos y falla con los de `failing`. */
function fakeBackend({
  titles = [],
  remaining = null,
  failing = {},
}: {
  titles?: string[] | null;
  remaining?: number | null;
  failing?: Record<string, string>;
} = {}) {
  const added: DocumentToAdd[] = [];
  const backend: DocumentBackend = {
    async getNotebookState() {
      return { titles: titles && new Set(titles), remaining };
    },
    async addDocument(_id, document) {
      const reason = failing[document.url];
      if (reason) throw new Error(reason);
      added.push(document);
    },
  };
  return { backend, added };
}

const doc = (n: number, name = `Documento ${n}`): DocumentToAdd => ({
  url: `https://e.es/${n}.pdf`,
  kind: 'pdf',
  name,
});

async function run(backend: DocumentBackend, documents: DocumentToAdd[]) {
  const statuses: [string, DocumentStatus][] = [];
  const response = await addDocuments(backend, notebook, documents, (url, status) =>
    statuses.push([url, status]),
  );
  return {
    response,
    statuses,
    last: (url: string) => statuses.filter(([u]) => u === url).at(-1)?.[1],
  };
}

describe('añadir un documento', () => {
  it('CA-04: lo añade con su nombre, pasa por "añadiendo" y "añadido" y muestra M-12', async () => {
    const { backend, added } = fakeBackend();
    const { response, statuses } = await run(backend, [doc(1, 'Memoria 2025')]);
    expect(added).toEqual([doc(1, 'Memoria 2025')]);
    expect(statuses.map(([, s]) => s.state)).toEqual(['adding', 'added']);
    expect(response).toEqual({ ok: true, addedAny: true, message: m.documentAdded('Física') });
  });

  it('CA-28 (RN-15): no lo añade si ya hay una fuente con el mismo nombre y muestra M-15', async () => {
    const { backend, added } = fakeBackend({ titles: ['Memoria 2025'] });
    const { response, last } = await run(backend, [doc(1, 'Memoria 2025')]);
    expect(added).toEqual([]);
    expect(last(doc(1).url)).toEqual({
      state: 'present',
      message: m.documentAlreadyPresent('Física'),
    });
    expect(response).toEqual({
      ok: true,
      addedAny: false,
      message: m.documentAlreadyPresent('Física'),
    });
  });

  it('CA-12 (CB-03): si no se puede descargar, muestra M-17 con el motivo en su estado', async () => {
    const { backend } = fakeBackend({ failing: { [doc(1).url]: 'la web exige iniciar sesión' } });
    const { response, last } = await run(backend, [doc(1)]);
    const message = m.documentRejected('la web exige iniciar sesión');
    expect(last(doc(1).url)).toEqual({ state: 'failed', message });
    expect(response).toEqual({ ok: false, addedAny: false, message });
  });

  it('en un cuaderno lleno es un rechazo (M-17), no M-16', async () => {
    const { backend, added } = fakeBackend({ remaining: 0 });
    const { response, last } = await run(backend, [doc(1)]);
    expect(added).toEqual([]);
    expect(response.message).toBe(m.documentRejected(NOTEBOOK_FULL));
    expect(last(doc(1).url)?.state).toBe('failed');
  });

  it('SUP-04: si no se sabe qué fuentes tiene el cuaderno, lo añade sin comprobar', async () => {
    const { backend, added } = fakeBackend({ titles: null });
    await run(backend, [doc(1)]);
    expect(added).toHaveLength(1);
  });
});

describe('añadir una selección', () => {
  it('CA-08: añade todos y muestra M-13', async () => {
    const { backend, added } = fakeBackend({ remaining: 3 });
    const { response } = await run(backend, [doc(1), doc(2), doc(3)]);
    expect(added).toHaveLength(3);
    expect(response).toEqual({ ok: true, addedAny: true, message: m.documentsAdded(3, 'Física') });
  });

  it('CA-10 (RN-08, CB-01): si no caben, no añade ninguno y muestra M-16', async () => {
    const { backend, added } = fakeBackend({ remaining: 2 });
    const { response, statuses } = await run(backend, [doc(1), doc(2), doc(3)]);
    expect(added).toEqual([]);
    expect(statuses).toEqual([]);
    expect(response).toEqual({
      ok: false,
      addedAny: false,
      message: m.documentsNoRoom(3, 'Física', 2),
    });
  });

  it('SUP-03: para el cupo solo cuentan los documentos que no están ya en el cuaderno', async () => {
    const { backend, added } = fakeBackend({ remaining: 2, titles: ['Documento 1'] });
    const { response } = await run(backend, [doc(1), doc(2), doc(3)]);
    expect(added.map((d) => d.name)).toEqual(['Documento 2', 'Documento 3']);
    expect(response.message).toBe(m.documentsPartial(2, 3, 'Física', 1, 0));
  });

  it('CA-11 (RN-09): si uno falla, añade los demás y muestra M-14', async () => {
    const { backend, added } = fakeBackend({ failing: { [doc(2).url]: 'el documento no existe' } });
    const { response, last } = await run(backend, [doc(1), doc(2), doc(3)]);
    expect(added.map((d) => d.url)).toEqual([doc(1).url, doc(3).url]);
    expect(last(doc(2).url)).toEqual({
      state: 'failed',
      message: m.documentRejected('el documento no existe'),
    });
    expect(response).toEqual({
      ok: true,
      addedAny: true,
      message: m.documentsPartial(2, 3, 'Física', 0, 1),
    });
  });

  it('CA-14 (CB-05): si no se puede añadir ninguno, muestra M-18 con el motivo', async () => {
    const reason = 'NotebookLM no admite el formato';
    const { backend } = fakeBackend({ failing: { [doc(1).url]: reason, [doc(2).url]: reason } });
    const { response } = await run(backend, [doc(1), doc(2)]);
    expect(response).toEqual({ ok: false, addedAny: false, message: m.documentsNoneAdded(reason) });
  });

  it('CA-15 (RN-10, CB-02): añade solo los que faltan y cuenta los ya presentes en M-14', async () => {
    const { backend, added } = fakeBackend({ titles: ['Documento 2'] });
    const { response, last } = await run(backend, [doc(1), doc(2), doc(3)]);
    expect(added).toHaveLength(2);
    expect(last(doc(2).url)?.state).toBe('present');
    expect(response.message).toBe(m.documentsPartial(2, 3, 'Física', 1, 0));
  });

  it('dos documentos de la selección con el mismo nombre: el segundo cuenta como ya presente', async () => {
    const { backend, added } = fakeBackend();
    const { last } = await run(backend, [doc(1, 'Guía'), doc(2, 'Guía')]);
    expect(added).toHaveLength(1);
    expect(last(doc(2).url)?.state).toBe('present');
  });
});

describe('sesión cerrada (REQ-004)', () => {
  it('CB-08: si Gemini Notebook rechaza un documento por falta de sesión, el error sube (M-19)', async () => {
    const { backend, added } = fakeBackend();
    backend.addDocument = () => Promise.reject(new NotLoggedInError());
    await expect(run(backend, [doc(1), doc(2)])).rejects.toBeInstanceOf(NotLoggedInError);
    expect(added).toEqual([]);
  });
});
