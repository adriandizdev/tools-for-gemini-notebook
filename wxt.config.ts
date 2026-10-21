import { defineConfig } from 'wxt';
import { NOTEBOOKLM_MATCHES, YOUTUBE_MATCHES } from './utils/domains';

export default defineConfig({
  manifest: {
    name: 'NotebookLM Tools',
    description:
      'Amplía Gemini Notebook (NotebookLM): exporta conversaciones a PDF conservando las fórmulas y añade vídeos de YouTube como fuentes.',
    permissions: ['storage'],
    // Permiten leer la URL de la pestaña activa en estas páginas (el popup elige así sus acciones)
    // y que el background llame a NotebookLM y YouTube con las cookies del usuario.
    host_permissions: [...NOTEBOOKLM_MATCHES, ...YOUTUBE_MATCHES],
  },
});
