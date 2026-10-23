import { defineConfig } from 'wxt';
import { ALL_WEBS, NOTEBOOKLM_MATCHES, YOUTUBE_MATCHES } from './utils/domains';

export default defineConfig({
  manifest: {
    name: 'NotebookLM Tools',
    description:
      'Amplía Gemini Notebook (NotebookLM): exporta conversaciones a PDF conservando las fórmulas y añade como fuentes vídeos de YouTube, documentos de cualquier web y temas del visor de UNIR.',
    // `activeTab` da la URL de la pestaña al abrir el panel y deja buscar en ella con `scripting`.
    permissions: ['storage', 'activeTab', 'scripting'],
    // Permiten leer la URL de la pestaña activa en estas páginas (el popup elige así sus acciones)
    // y que el background llame a NotebookLM y YouTube con las cookies del usuario.
    host_permissions: [...NOTEBOOKLM_MATCHES, ...YOUTUBE_MATCHES],
    // Para ver el tamaño de los documentos y descargarlos de cualquier web (REQ-002). Se pide
    // desde el panel la primera vez, no al instalar (RF-21).
    optional_host_permissions: ALL_WEBS,
    // En incógnito, el background corre aparte y llama a Gemini Notebook con las cookies de
    // incógnito: solo cuentan las sesiones iniciadas allí (REQ-004, RN-01, CB-02).
    incognito: 'split',
  },
});
