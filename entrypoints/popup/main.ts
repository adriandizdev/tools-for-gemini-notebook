import { NO_ACTIONS } from '@/utils/messages';
import { classifyTab } from '@/utils/page';
import { setupAdd } from './add';
import { setupExport } from './export';

export type StatusKind = 'error' | 'success' | 'info';

const status = document.querySelector<HTMLParagraphElement>('#status')!;

function showStatus(message: string, kind: StatusKind = 'error') {
  status.textContent = message;
  status.className = kind;
}

// El panel solo ofrece las acciones de la página activa (RF-11, RF-12, RF-13).
// `tab.url` solo llega en los dominios con host permission (utils/domains.ts).
browser.tabs
  .query({ active: true, currentWindow: true })
  .then(([tab]) => {
    const page = classifyTab(tab?.url);
    if (page.kind === 'notebook' && tab?.id !== undefined) {
      document.querySelector<HTMLElement>('#export-section')!.hidden = false;
      setupExport(tab.id, showStatus);
    } else if (page.kind === 'video' || page.kind === 'playlist') {
      document.querySelector<HTMLElement>('#add-section')!.hidden = false;
      setupAdd(page, showStatus);
    } else {
      showStatus(NO_ACTIONS, 'info');
    }
  })
  .catch((error: unknown) => showStatus(error instanceof Error ? error.message : String(error)));
