/** Respuesta de la API del visor de UNIR tal como la devuelve `callVisorApi`. */
export interface VisorApiResult {
  /** Código HTTP; 0 si falla la red y 401 si la página no tiene token. */
  status: number;
  /** El JSON de la respuesta, o `null` si no lo es. */
  body: unknown;
}

/**
 * Se inyecta en la pestaña del visor con `scripting.executeScript`, que serializa la función:
 * tiene que ser autocontenida (sin imports ni nada de fuera de su cuerpo).
 *
 * La API del visor no usa cookies sino el token OIDC que la página guarda en `sessionStorage`
 * (verificado el 2026-10-22). Se llama desde la propia página para que el token no salga de ella
 * (REQ-003, SUP-07).
 */
export async function callVisorApi(method: 'GET' | 'POST', path: string): Promise<VisorApiResult> {
  const readToken = (): string | null => {
    const direct = sessionStorage.getItem('access_token');
    if (direct) return direct;
    // Otras librerías OIDC guardan el usuario entero como JSON (`oidc.user:…`).
    for (let i = 0; i < sessionStorage.length; i++) {
      const value = sessionStorage.getItem(sessionStorage.key(i) ?? '');
      if (!value?.includes('access_token')) continue;
      try {
        const token: unknown = (JSON.parse(value) as Record<string, unknown>).access_token;
        if (typeof token === 'string' && token) return token;
      } catch {
        // No es JSON: se prueba la siguiente clave.
      }
    }
    return null;
  };

  const token = readToken();
  if (!token) return { status: 401, body: null };
  try {
    const response = await fetch(path, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: method === 'POST' ? '{}' : undefined,
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Sin JSON: basta con el código.
    }
    return { status: response.status, body };
  } catch {
    return { status: 0, body: null };
  }
}
