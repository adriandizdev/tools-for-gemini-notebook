/**
 * Cliente de los RPC internos (`batchexecute`) de Gemini Notebook (NotebookLM).
 *
 * Es el único sitio acoplado a esos RPC, igual que `selectors.ts` lo es al DOM. Los IDs y el
 * formato se verificaron contra la página real el 2026-10-12; los recortes están en
 * `__fixtures__/notebooklm-rpc/`. Si Google los cambia, actualiza este módulo y los fixtures juntos.
 */

import { dig } from './dig';

export const NOTEBOOKLM_ORIGIN = 'https://notebook.google.com';
const BATCHEXECUTE_PATH = '/_/LabsTailwindUi/data/batchexecute';

const RPC = {
  listNotebooks: 'wXbhsf',
  addSources: 'izAoDd',
  deleteSources: 'tGMBJ',
  /** Registra una fuente de tipo fichero; el contenido se sube después a `UPLOAD_PATH`. Verificado el 2026-10-21. */
  registerFile: 'o4cbdc',
  renameSource: 'b7Wfje',
} as const;

const UPLOAD_PATH = '/upload/_/?authuser=0';
/** Tipo que la web envía al registrar cualquier fichero local (PDF, Word o PowerPoint). */
const LOCAL_FILE = 3;

/** Contexto que la web envía junto a las altas y bajas de fuentes. */
const CLIENT_CONTEXT = [
  2,
  null,
  [1],
  [1, null, null, null, null, null, null, null, null, null, [1, 3]],
];

/** Estado de una fuente: 2 = lista para usar, 3 = error al importarla. */
const SOURCE_READY = 2;

export interface Session {
  /** Token XSRF (`SNlM0e`). */
  at: string;
  /** `FdrFJe`. */
  fsid: string;
  /** Versión del frontend (`cfb2h`). */
  bl: string;
}

export interface Source {
  id: string;
  title: string;
  /** Id del vídeo si la fuente es de YouTube; `null` si no lo es o NotebookLM aún no lo sabe. */
  youtubeId: string | null;
  ready: boolean;
}

export interface NotebookInfo {
  id: string;
  title: string;
  sources: Source[];
  /** Máximo de fuentes del cuaderno según el plan del usuario; `null` si no viene. */
  maxSources: number | null;
}

export class NotLoggedInError extends Error {
  constructor() {
    super('No hay sesión iniciada en Gemini Notebook');
  }
}

/** NotebookLM ha respondido con un error al RPC (p. ej. `[9]` si rechaza todos los vídeos). */
export class RpcError extends Error {
  constructor(
    readonly rpcId: string,
    readonly code: unknown,
  ) {
    super(`Gemini Notebook ha devuelto un error (${rpcId} ${JSON.stringify(code)})`);
  }
}

/** Lee los tokens de la página de inicio. Sin sesión, la página no incluye `SNlM0e`. */
export function parseSession(html: string): Session | null {
  const read = (key: string) => new RegExp(`"${key}":"([^"]+)"`).exec(html)?.[1];
  const at = read('SNlM0e');
  const fsid = read('FdrFJe');
  const bl = read('cfb2h');
  return at && fsid && bl ? { at, fsid, bl } : null;
}

/**
 * Extrae el resultado de `rpcId` de una respuesta `batchexecute`: prefijo `)]}'` y después
 * fragmentos JSON precedidos de su longitud. El resultado viaja como JSON dentro de un string.
 */
export function parseBatchExecute(text: string, rpcId: string): unknown {
  for (const line of text.replace(/^\)\]\}'/, '').split('\n')) {
    if (!line.startsWith('[')) continue;
    let chunk: unknown;
    try {
      chunk = JSON.parse(line);
    } catch {
      continue;
    }
    if (!Array.isArray(chunk)) continue;
    for (const entry of chunk) {
      if (!Array.isArray(entry) || entry[0] !== 'wrb.fr' || entry[1] !== rpcId) continue;
      if (typeof entry[2] !== 'string') throw new RpcError(rpcId, entry[5]);
      return JSON.parse(entry[2]);
    }
  }
  throw new RpcError(rpcId, 'sin respuesta');
}

export function parseNotebooks(data: unknown): NotebookInfo[] {
  const list = (data as unknown[][] | null)?.[0];
  if (!Array.isArray(list)) throw new Error('Formato inesperado en la lista de cuadernos');
  return list.flatMap((nb: unknown) => {
    const id = dig(nb, 2);
    if (!Array.isArray(nb) || typeof id !== 'string') return [];
    const title = dig(nb, 0);
    // nb[10]: [nº cuadernos?, máx. cuadernos, máx. fuentes por cuaderno, máx. palabras por fuente, …]
    const maxSources = dig(nb, 10, 2);
    return [
      {
        id,
        title: typeof title === 'string' && title.trim() ? title : 'Cuaderno sin título',
        sources: parseSources(dig(nb, 1)),
        maxSources: typeof maxSources === 'number' ? maxSources : null,
      },
    ];
  });
}

/** Lista de fuentes: tanto la de un cuaderno como la que devuelve el alta. */
export function parseSources(list: unknown): Source[] {
  if (!Array.isArray(list)) return [];
  return (list as unknown[]).flatMap((s) => {
    const id = dig(s, 0, 0);
    if (typeof id !== 'string') return [];
    const title = dig(s, 1);
    const youtubeId = dig(s, 2, 5, 1);
    return [
      {
        id,
        title: typeof title === 'string' ? title : '',
        youtubeId: typeof youtubeId === 'string' ? youtubeId : null,
        ready: dig(s, 3, 1) === SOURCE_READY,
      },
    ];
  });
}

export function batchExecuteRequest(
  session: Session,
  rpcId: string,
  args: unknown,
  sourcePath = '/',
) {
  const query = new URLSearchParams({
    rpcids: rpcId,
    'source-path': sourcePath,
    bl: session.bl,
    'f.sid': session.fsid,
    hl: 'es',
    rt: 'c',
  });
  const body = new URLSearchParams({
    'f.req': JSON.stringify([[[rpcId, JSON.stringify(args), null, 'generic']]]),
    at: session.at,
  });
  return {
    url: `${NOTEBOOKLM_ORIGIN}${BATCHEXECUTE_PATH}?${query}`,
    init: {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString(),
    } satisfies RequestInit,
  };
}

/** Cliente con las cookies del usuario. `fetchFn` se inyecta para poder probarlo. */
export function createNotebookLmClient(fetchFn: typeof fetch = fetch) {
  let session: Session | undefined;

  async function getSession(): Promise<Session> {
    if (session) return session;
    const response = await fetchFn(`${NOTEBOOKLM_ORIGIN}/`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Gemini Notebook no responde (HTTP ${response.status})`);
    const parsed = parseSession(await response.text());
    if (!parsed) throw new NotLoggedInError();
    return (session = parsed);
  }

  async function call(rpcId: string, args: unknown, sourcePath?: string): Promise<unknown> {
    const { url, init } = batchExecuteRequest(await getSession(), rpcId, args, sourcePath);
    const response = await fetchFn(url, init);
    if (response.status === 401) throw new NotLoggedInError();
    if (!response.ok) throw new Error(`Gemini Notebook no responde (HTTP ${response.status})`);
    return parseBatchExecute(await response.text(), rpcId);
  }

  const notebookPath = (notebookId: string) => `/notebook/${notebookId}`;

  return {
    async listNotebooks(): Promise<NotebookInfo[]> {
      return parseNotebooks(await call(RPC.listNotebooks, [null, 1, null, [2]]));
    },

    /** Añade las URLs en una sola llamada y devuelve las fuentes que NotebookLM ha aceptado. */
    async addUrls(notebookId: string, urls: string[]): Promise<Source[]> {
      const sources = urls.map((url) => [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        [url],
        null,
        null,
        1,
      ]);
      const data = await call(
        RPC.addSources,
        [sources, notebookId, CLIENT_CONTEXT],
        notebookPath(notebookId),
      );
      return parseSources((data as unknown[] | null)?.[0]);
    },

    async deleteSources(notebookId: string, sourceIds: string[]): Promise<void> {
      if (!sourceIds.length) return;
      await call(
        RPC.deleteSources,
        [sourceIds.map((id) => [id]), CLIENT_CONTEXT],
        notebookPath(notebookId),
      );
    },

    /**
     * Primer paso de la subida: crea la fuente vacía y devuelve su id. `fileName` debe acabar en
     * una extensión que Gemini Notebook admita; si no, la subida responde "Unsupported file extension".
     */
    async registerFile(notebookId: string, fileName: string): Promise<string> {
      const data = await call(
        RPC.registerFile,
        [[[fileName, LOCAL_FILE]], notebookId, CLIENT_CONTEXT],
        notebookPath(notebookId),
      );
      const id = dig(data, 0, 0, 0, 0);
      if (typeof id !== 'string') throw new Error('Gemini Notebook no ha creado la fuente');
      return id;
    },

    /**
     * Segundo paso: sube el contenido con el protocolo reanudable de Google en dos peticiones
     * (`start` y `upload, finalize`). Si falla, la fuente queda registrada sin contenido.
     */
    async uploadFile(
      notebookId: string,
      sourceId: string,
      fileName: string,
      content: Blob,
    ): Promise<void> {
      const headers = {
        'x-goog-authuser': '0',
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      };
      const start = await fetchFn(`${NOTEBOOKLM_ORIGIN}${UPLOAD_PATH}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...headers,
          'x-goog-upload-command': 'start',
          'x-goog-upload-header-content-length': String(content.size),
          'x-goog-upload-protocol': 'resumable',
        },
        body: JSON.stringify({
          PROJECT_ID: notebookId,
          SOURCE_NAME: fileName,
          SOURCE_ID: sourceId,
        }),
      });
      const uploadUrl = start.headers.get('x-goog-upload-url');
      if (start.status === 401) throw new NotLoggedInError();
      if (!start.ok || !uploadUrl)
        throw new Error(`Gemini Notebook no admite la subida: ${(await start.text()).trim()}`);

      const upload = await fetchFn(uploadUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...headers,
          'x-goog-upload-command': 'upload, finalize',
          'x-goog-upload-offset': '0',
        },
        body: content,
      });
      if (!upload.ok || upload.headers.get('x-goog-upload-status') !== 'final') {
        throw new Error(`Gemini Notebook no ha recibido el documento (HTTP ${upload.status})`);
      }
    },

    async renameSource(notebookId: string, sourceId: string, title: string): Promise<void> {
      await call(
        RPC.renameSource,
        [null, [sourceId], [[[title]]], CLIENT_CONTEXT],
        notebookPath(notebookId),
      );
    },
  };
}

export type NotebookLmClient = ReturnType<typeof createNotebookLmClient>;
