import { afterEach, describe, expect, it, vi } from 'vitest';
import { callVisorApi } from './unir-page';

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

const authorization = (init: RequestInit | undefined) =>
  new Headers(init?.headers).get('authorization');

function stubFetch(response: () => Promise<Response>) {
  const fetchFn = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(() =>
    response(),
  );
  vi.stubGlobal('fetch', fetchFn);
  return fetchFn;
}

describe('callVisorApi', () => {
  it('llama a la API con el token de la página y devuelve el JSON', async () => {
    sessionStorage.setItem('access_token', 'tok');
    const fetchFn = stubFetch(() =>
      Promise.resolve(Response.json({ downloadUrl: 'https://cms.unir.net/f' })),
    );
    const result = await callVisorApi('POST', '/api/v1/topics/1/download');
    expect(result).toEqual({ status: 200, body: { downloadUrl: 'https://cms.unir.net/f' } });
    const [path, init] = fetchFn.mock.calls[0]!;
    expect(path).toBe('/api/v1/topics/1/download');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{}');
    expect(authorization(init)).toBe('Bearer tok');
  });

  it('encuentra el token guardado como usuario OIDC en JSON', async () => {
    sessionStorage.setItem('oidc.user:https://sso:visor', JSON.stringify({ access_token: 'tok2' }));
    const fetchFn = stubFetch(() => Promise.resolve(Response.json({ topics: [] })));
    await callVisorApi('GET', '/api/v3/subjects/1/user-topics');
    expect(authorization(fetchFn.mock.calls[0]![1])).toBe('Bearer tok2');
  });

  it('sin token responde 401 sin llamar a la API', async () => {
    const fetchFn = stubFetch(() => Promise.resolve(Response.json({})));
    expect(await callVisorApi('GET', '/x')).toEqual({ status: 401, body: null });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('un fallo de red es el estado 0', async () => {
    sessionStorage.setItem('access_token', 'tok');
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await callVisorApi('GET', '/x')).toEqual({ status: 0, body: null });
  });
});
