import { describe, expect, it } from 'vitest';
import {
  NotLoggedInError,
  RpcError,
  batchExecuteRequest,
  createNotebookLmClient,
  parseBatchExecute,
  parseNotebooks,
  parseSession,
  parseSources,
} from './notebooklm-api';
import addSources from './__fixtures__/notebooklm-rpc/add-sources.txt?raw';
import addSourcesError from './__fixtures__/notebooklm-rpc/add-sources-error.txt?raw';
import deleteSources from './__fixtures__/notebooklm-rpc/delete-sources.txt?raw';
import listNotebooks from './__fixtures__/notebooklm-rpc/list-notebooks.txt?raw';
import listNotebooksEmpty from './__fixtures__/notebooklm-rpc/list-notebooks-empty.txt?raw';

const fixtures: Record<string, string> = {
  'add-sources.txt': addSources,
  'add-sources-error.txt': addSourcesError,
  'delete-sources.txt': deleteSources,
  'list-notebooks.txt': listNotebooks,
  'list-notebooks-empty.txt': listNotebooksEmpty,
};
const fixture = (name: string) => fixtures[name]!;

const PRUEBA = '7cb102e6-4599-4f92-b6d7-86df5ac7e408';
const session = { at: 'AT_TOKEN', fsid: '123', bl: 'boq_labs-tailwind-frontend_20261011.03_p0' };
const homeHtml = `<script>window.WIZ_global_data = {"FdrFJe":"123","SNlM0e":"AT_TOKEN","cfb2h":"${session.bl}"};</script>`;

describe('parseSession', () => {
  it('lee los tokens de la página de inicio', () => {
    expect(parseSession(homeHtml)).toEqual(session);
  });

  it('devuelve null sin sesión (la página no trae SNlM0e)', () => {
    expect(parseSession('<script>window.WIZ_global_data = {"FdrFJe":"123","cfb2h":"x"};</script>')).toBeNull();
  });
});

describe('parseNotebooks', () => {
  const notebooks = parseNotebooks(parseBatchExecute(fixture('list-notebooks.txt'), 'wXbhsf'));

  it('lista los cuadernos con id, título y límite de fuentes', () => {
    expect(notebooks.map(({ id, title, maxSources }) => ({ id, title, maxSources }))).toEqual([
      { id: PRUEBA, title: 'Prueba', maxSources: 300 },
      { id: '0b6a2b8e-1c1f-4f2e-9a4e-3f1f0c1d2e3f', title: 'Física', maxSources: 300 },
    ]);
  });

  it('lee las fuentes de YouTube y marca las que tienen error', () => {
    expect(notebooks[0]!.sources).toEqual([
      { id: '39339623-b06f-466c-bb39-59c093dce583', youtubeId: 'Ilg3gGewQ5U', ready: true },
      { id: 'c1dc93f0-e751-410e-aca3-a36091e1319d', youtubeId: 'aircAruvnKk', ready: true },
      { id: 'ad258fe4-0fdc-4e65-8d92-50d878d58b0f', youtubeId: 'IHZwWFHWa-w', ready: true },
      { id: '2f6554ad-294f-4f75-b591-00abdfacca44', youtubeId: null, ready: false },
    ]);
    expect(notebooks[1]!.sources).toEqual([]);
  });

  it('acepta una cuenta sin cuadernos', () => {
    expect(parseNotebooks(parseBatchExecute(fixture('list-notebooks-empty.txt'), 'wXbhsf'))).toEqual([]);
  });
});

describe('parseBatchExecute', () => {
  it('devuelve las fuentes aceptadas en un alta', () => {
    const data = parseBatchExecute(fixture('add-sources.txt'), 'izAoDd') as unknown[];
    expect(parseSources(data[0])).toEqual([
      { id: 'c78c9f58-8c09-4845-aca7-02b71358390d', youtubeId: 'KuXjwB4LzSA', ready: true },
    ]);
  });

  it('lanza RpcError si NotebookLM rechaza la llamada', () => {
    expect(() => parseBatchExecute(fixture('add-sources-error.txt'), 'izAoDd')).toThrow(RpcError);
  });

  it('lanza RpcError si la respuesta no trae el RPC pedido', () => {
    expect(() => parseBatchExecute(fixture('delete-sources.txt'), 'izAoDd')).toThrow(RpcError);
  });
});

describe('batchExecuteRequest', () => {
  it('envía el RPC y el token como formulario', () => {
    const args = [['x'], PRUEBA];
    const { url, init } = batchExecuteRequest(session, 'izAoDd', args, `/notebook/${PRUEBA}`);
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/_/LabsTailwindUi/data/batchexecute');
    expect(parsed.searchParams.get('rpcids')).toBe('izAoDd');
    expect(parsed.searchParams.get('source-path')).toBe(`/notebook/${PRUEBA}`);
    const body = new URLSearchParams(init.body);
    expect(body.get('at')).toBe('AT_TOKEN');
    expect(JSON.parse(body.get('f.req')!)).toEqual([[['izAoDd', JSON.stringify(args), null, 'generic']]]);
  });
});

describe('createNotebookLmClient', () => {
  const respond = (body: string) => Promise.resolve(new Response(body));

  it('lanza NotLoggedInError si no hay sesión', async () => {
    const client = createNotebookLmClient(() => respond('<html>sin sesión</html>'));
    await expect(client.listNotebooks()).rejects.toBeInstanceOf(NotLoggedInError);
  });

  it('pide la sesión una sola vez', async () => {
    const calls: string[] = [];
    const client = createNotebookLmClient((input) => {
      calls.push(input instanceof Request ? input.url : String(input));
      return respond(calls.length === 1 ? homeHtml : fixture('list-notebooks.txt'));
    });
    expect(await client.listNotebooks()).toHaveLength(2);
    expect(await client.listNotebooks()).toHaveLength(2);
    expect(calls.filter((url) => url === 'https://notebook.google.com/')).toHaveLength(1);
  });
});
