/**
 * Selectores CSS del DOM de NotebookLM. Es el único punto acoplado a la UI de
 * Google: si la extracción deja de encontrar mensajes, actualiza estos valores.
 *
 * Verificados contra notebooklm.google.com el 2026-10-05
 * (ver utils/__fixtures__/notebooklm-dom/notebooklm-chat.html).
 */
export const SELECTORS = {
  /** Mensaje escrito por el usuario. */
  userMessage: '.from-user-container',
  /** Respuesta generada por NotebookLM. */
  assistantMessage: '.to-user-container',
  /** Contenedor del texto dentro de un mensaje (deja fuera la barra de acciones). */
  messageContent: '.message-text-content',
  /** Fórmula renderizada por KaTeX; el atributo data-math guarda el LaTeX original. */
  math: '[data-math]',
  /** Elementos de interfaz que no deben aparecer en el PDF (citas, botones, iconos…). */
  noise: 'mat-icon, button, [role="toolbar"]',
  /** Título del cuaderno; si no existe se usa document.title. */
  notebookTitle: '.cover-title',
} as const;
