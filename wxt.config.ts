import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'NotebookLM to PDF',
    description:
      'Exporta conversaciones de Gemini Notebook (NotebookLM) a PDF conservando fórmulas y ecuaciones.',
    permissions: ['storage'],
  },
});
