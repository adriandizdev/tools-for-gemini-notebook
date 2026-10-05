/**
 * Selectores CSS del DOM de NotebookLM. Es el único punto acoplado a la UI de
 * Google: si la extracción deja de encontrar mensajes, actualiza estos valores.
 *
 * ⚠️ PENDIENTE DE VERIFICAR contra la página real de notebooklm.google.com.
 */
export const SELECTORS = {
  /** Mensaje escrito por el usuario. */
  userMessage: '.from-user-container',
  /** Respuesta generada por NotebookLM. */
  assistantMessage: '.to-user-container',
  /** Contenedor del texto dentro de un mensaje; si no existe se usa el mensaje entero. */
  messageContent: '.message-content',
  /** Elementos de interfaz que no deben aparecer en el PDF (botones de copiar, valorar…). */
  noise: 'mat-icon, button, [role="toolbar"]',
  /** Título del cuaderno; si no existe se usa document.title. */
  notebookTitle: '.notebook-title',
} as const;
