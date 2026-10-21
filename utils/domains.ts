/**
 * Dominios con los que trabaja la extensión. Se usan como `matches` del content script
 * y como `host_permissions`, que además permiten leer `tab.url` en estas páginas.
 */

// NotebookLM ahora es "Gemini Notebook" (notebook.google.com); se mantiene el dominio antiguo.
export const NOTEBOOKLM_HOSTS = ['notebook.google.com', 'notebooklm.google.com'];
export const YOUTUBE_HOSTS = ['www.youtube.com', 'm.youtube.com'];

const toMatches = (hosts: string[]) => hosts.map((host) => `https://${host}/*`);

export const NOTEBOOKLM_MATCHES = toMatches(NOTEBOOKLM_HOSTS);
export const YOUTUBE_MATCHES = toMatches(YOUTUBE_HOSTS);

/** Permiso opcional sobre cualquier web, para los documentos de REQ-002. */
export const ALL_WEBS = ['http://*/*', 'https://*/*'];
