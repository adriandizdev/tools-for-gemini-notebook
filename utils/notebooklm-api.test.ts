import { describe, expect, it } from 'vitest';
import {
  NotLoggedInError,
  RpcError,
  batchExecuteRequest,
  createNotebookLmClient,
  listAccounts,
  parseBatchExecute,
  parseNotebooks,
  parseSession,
  parseSources,
} from './notebooklm-api';
import addFile from './__fixtures__/notebooklm-rpc/add-file.txt?raw';
import addSources from './__fixtures__/notebooklm-rpc/add-sources.txt?raw';
import addSourcesError from './__fixtures__/notebooklm-rpc/add-sources-error.txt?raw';
import deleteSources from './__fixtures__/notebooklm-rpc/delete-sources.txt?raw';
import listNotebooks from './__fixtures__/notebooklm-rpc/list-notebooks.txt?raw';
import listNotebooksEmpty from './__fixtures__/notebooklm-rpc/list-notebooks-empty.txt?raw';
import renameSource from './__fixtures__/notebooklm-rpc/rename-source.txt?raw';
import homeFixture from './__fixtures__/notebooklm-dom/notebooklm-home.html?raw';

const fixtures: Record<string, string> = {
  'add-file.txt': addFile,
  'add-sources.txt': addSources,
  'add-sources-error.txt': addSourcesError,
  'delete-sources.txt': deleteSources,
  'list-notebooks.txt': listNotebooks,
  'list-notebooks-empty.txt': listNotebooksEmpty,
  'rename-source.txt': renameSource,
};
const fixture = (name: string) => fixtures[name]!;

const PRUEBA = '7cb102e6-4599-4f92-b6d7-86df5ac7e408';
const session = {
  at: 'AT_TOKEN',
  fsid: '123',
  bl: 'boq_labs-tailwind-frontend_20261011.03_p0',
  email: 'ana@gmail.com',
  index: 0,
};
/** Página de inicio de la cuenta `index` (la forma real está en `__fixtures__/notebooklm-dom/notebooklm-home.html`). */
const home = (email: string, index: number) =>
  `<script>window.WIZ_global_data = {"FdrFJe":"123","QrtxK":"${index}","SNlM0e":"AT_TOKEN","cfb2h":"${session.bl}","oPEP7c":"${email}"};</script>`;
const homeHtml = home(session.email, 0);
const HOME = 'https://notebook.google.com/?authuser=0';

describe('parseSession', () => {
  it('lee los tokens y la cuenta de la página de inicio', () => {
    expect(parseSession(homeHtml)).toEqual(session);
  });

  it('lee la sesión de la página real', () => {
    expect(parseSession(homeFixture)).toEqual({
      at: 'AT_TOKEN',
      fsid: '-1234567890123456789',
      bl: 'boq_labs-tailwind-frontend_20261021.16_p0',
      email: 'ana@gmail.com',
      index: 0,
    });
  });

  it('devuelve null sin sesión (la página no trae SNlM0e)', () => {
    expect(
      parseSession('<script>window.WIZ_global_data = {"FdrFJe":"123","cfb2h":"x"};</script>'),
    ).toBeNull();
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
      {
        id: '39339623-b06f-466c-bb39-59c093dce583',
        title: 'Backpropagation, intuitively | Deep Learning Chapter 3',
        youtubeId: 'Ilg3gGewQ5U',
        ready: true,
      },
      {
        id: 'c1dc93f0-e751-410e-aca3-a36091e1319d',
        title: 'But what is a neural network? | Deep learning chapter 1',
        youtubeId: 'aircAruvnKk',
        ready: true,
      },
      {
        id: 'ad258fe4-0fdc-4e65-8d92-50d878d58b0f',
        title: 'Gradient descent, how neural networks learn | Deep Learning Chapter 2',
        youtubeId: 'IHZwWFHWa-w',
        ready: true,
      },
      {
        id: '2f6554ad-294f-4f75-b591-00abdfacca44',
        title: 'https://www.youtube.com/watch?v=zzzzzzzzzz1',
        youtubeId: null,
        ready: false,
      },
    ]);
    expect(notebooks[1]!.sources).toEqual([]);
  });

  it('acepta una cuenta sin cuadernos', () => {
    expect(
      parseNotebooks(parseBatchExecute(fixture('list-notebooks-empty.txt'), 'wXbhsf')),
    ).toEqual([]);
  });
});

describe('parseBatchExecute', () => {
  it('devuelve las fuentes aceptadas en un alta', () => {
    const data = parseBatchExecute(fixture('add-sources.txt'), 'izAoDd') as unknown[];
    expect(parseSources(data[0])).toEqual([
      {
        id: 'c78c9f58-8c09-4845-aca7-02b71358390d',
        title: 'But what is a convolution?',
        youtubeId: 'KuXjwB4LzSA',
        ready: true,
      },
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
    const { url, init } = batchExecuteRequest(session, 1, 'izAoDd', args, `/notebook/${PRUEBA}`);
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/_/LabsTailwindUi/data/batchexecute');
    expect(parsed.searchParams.get('rpcids')).toBe('izAoDd');
    expect(parsed.searchParams.get('authuser')).toBe('1');
    expect(parsed.searchParams.get('source-path')).toBe(`/notebook/${PRUEBA}`);
    const body = new URLSearchParams(init.body);
    expect(body.get('at')).toBe('AT_TOKEN');
    expect(JSON.parse(body.get('f.req')!)).toEqual([
      [['izAoDd', JSON.stringify(args), null, 'generic']],
    ]);
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
    expect(calls.filter((url) => url === HOME)).toHaveLength(1);
  });

  it('REQ-004 (RF-08): trabaja con el índice de la cuenta indicada', async () => {
    const calls: string[] = [];
    const account = { email: 'ana.trabajo@gmail.com', authuser: 1 };
    const client = createNotebookLmClient((input) => {
      calls.push(input instanceof Request ? input.url : String(input));
      return respond(calls.length === 1 ? home(account.email, 1) : fixture('list-notebooks.txt'));
    }, account);
    await client.listNotebooks();
    expect(calls[0]).toBe('https://notebook.google.com/?authuser=1');
    expect(new URL(calls[1]!).searchParams.get('authuser')).toBe('1');
  });

  it('REQ-004 (RN-05): si el índice ya es de otra cuenta, lanza NotLoggedInError', async () => {
    const client = createNotebookLmClient(() => respond(home('otra@gmail.com', 1)), {
      email: 'ana.trabajo@gmail.com',
      authuser: 1,
    });
    await expect(client.listNotebooks()).rejects.toBeInstanceOf(NotLoggedInError);
  });
});

describe('listAccounts (REQ-004)', () => {
  const respond = (body: string) => Promise.resolve(new Response(body));
  const urlOf = (input: RequestInfo | URL) =>
    input instanceof Request ? input.url : String(input);
  /** Simula Google: un índice fuera de rango devuelve la cuenta 0. */
  const google = (emails: string[], { withIndex = true } = {}) => {
    const calls: number[] = [];
    const fetchFn = ((input: RequestInfo | URL) => {
      const n = Number(new URL(urlOf(input)).searchParams.get('authuser'));
      calls.push(n);
      if (!emails.length) return respond('<html>sin sesión</html>');
      const index = n < emails.length ? n : 0;
      const html = home(emails[index]!, index);
      return respond(withIndex ? html : html.replace(/"QrtxK":"\d+",/, ''));
    }) as typeof fetch;
    return { fetchFn, calls };
  };

  it('CB-01: sin sesión no hay cuentas', async () => {
    expect(await listAccounts(google([]).fetchFn)).toEqual([]);
  });

  it('lista las cuentas en orden y para cuando Google vuelve a la cuenta 0', async () => {
    const { fetchFn, calls } = google(['ana@gmail.com', 'ana.trabajo@gmail.com']);
    expect(await listAccounts(fetchFn)).toEqual([
      { email: 'ana@gmail.com', authuser: 0 },
      { email: 'ana.trabajo@gmail.com', authuser: 1 },
    ]);
    expect(calls).toEqual([0, 1, 2]);
  });

  it('sin índice en la página, para cuando se repite el correo', async () => {
    const { fetchFn } = google(['ana@gmail.com'], { withIndex: false });
    expect(await listAccounts(fetchFn)).toEqual([{ email: 'ana@gmail.com', authuser: 0 }]);
  });
});

describe('subida de ficheros (REQ-002)', () => {
  const SOURCE = 'aea809ec-2a01-47cf-a41d-6cb976dab683';
  const UPLOAD_URL =
    'https://notebook.google.com/upload/_/?authuser=0&upload_id=abc&upload_protocol=resumable';

  interface Call {
    url: string;
    headers: Record<string, string>;
    body: unknown;
  }

  /** Doble de `fetch` que responde según la URL y guarda cada petición. */
  function fakeFetch(routes: (url: string) => Response) {
    const calls: Call[] = [];
    const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push({
        url,
        headers: (init?.headers ?? {}) as Record<string, string>,
        body: init?.body,
      });
      return Promise.resolve(url === HOME ? new Response(homeHtml) : routes(url));
    }) as typeof fetch;
    return { client: createNotebookLmClient(fetchFn), calls };
  }

  it('registra el fichero con o4cbdc y devuelve el id de la fuente', async () => {
    const { client, calls } = fakeFetch(() => new Response(fixture('add-file.txt')));
    expect(await client.registerFile(PRUEBA, 'Prueba API REQ-002.docx')).toBe(SOURCE);
    const freq = new URLSearchParams(calls[1]!.body as string).get('f.req')!;
    const args = JSON.parse((JSON.parse(freq) as string[][][])[0]![0]![1]!) as unknown[];
    expect(args.slice(0, 2)).toEqual([[['Prueba API REQ-002.docx', 3]], PRUEBA]);
  });

  it('sube el contenido en dos pasos: start y upload, finalize', async () => {
    const { client, calls } = fakeFetch((url) =>
      url === UPLOAD_URL
        ? new Response('OK', { headers: { 'x-goog-upload-status': 'final' } })
        : new Response('', {
            headers: { 'x-goog-upload-url': UPLOAD_URL, 'x-goog-upload-status': 'active' },
          }),
    );
    const content = new Blob(['%PDF-1.4']);
    await client.uploadFile(PRUEBA, SOURCE, 'Guía.pdf', content);

    const [start, upload] = calls;
    expect(start!.url).toBe('https://notebook.google.com/upload/_/?authuser=0');
    expect(start!.headers).toMatchObject({
      'x-goog-upload-command': 'start',
      'x-goog-upload-protocol': 'resumable',
      'x-goog-upload-header-content-length': String(content.size),
    });
    expect(JSON.parse(start!.body as string)).toEqual({
      PROJECT_ID: PRUEBA,
      SOURCE_NAME: 'Guía.pdf',
      SOURCE_ID: SOURCE,
    });
    expect(upload!.url).toBe(UPLOAD_URL);
    expect(upload!.headers).toMatchObject({
      'x-goog-upload-command': 'upload, finalize',
      'x-goog-upload-offset': '0',
    });
    expect(upload!.body).toBe(content);
  });

  it('falla con el motivo de Gemini Notebook si rechaza la subida', async () => {
    const { client } = fakeFetch(
      () => new Response('Unsupported file extension for file', { status: 400 }),
    );
    await expect(client.uploadFile(PRUEBA, SOURCE, 'Guía', new Blob(['x']))).rejects.toThrow(
      'Unsupported file extension for file',
    );
  });

  it('falla si la subida no termina en estado final', async () => {
    const { client } = fakeFetch((url) =>
      url === UPLOAD_URL
        ? new Response('', { status: 500 })
        : new Response('', { headers: { 'x-goog-upload-url': UPLOAD_URL } }),
    );
    await expect(client.uploadFile(PRUEBA, SOURCE, 'Guía.pdf', new Blob(['x']))).rejects.toThrow(
      'HTTP 500',
    );
  });

  it('renombra la fuente con b7Wfje', async () => {
    const { client, calls } = fakeFetch(() => new Response(fixture('rename-source.txt')));
    await client.renameSource(PRUEBA, SOURCE, 'Prueba API renombrada');
    const freq = new URLSearchParams(calls[1]!.body as string).get('f.req')!;
    const args = JSON.parse((JSON.parse(freq) as string[][][])[0]![0]![1]!) as unknown[];
    expect(args.slice(0, 3)).toEqual([null, [SOURCE], [[['Prueba API renombrada']]]]);
  });
});
