import { NO_ACTIONS } from '@/utils/messages';
import { classifyTab } from '@/utils/page';
import { setupAdd } from './add';
import { setupDocuments } from './documents';
import { setupExport } from './export';

export type StatusKind = 'error' | 'success' | 'info';

const status = document.querySelector<HTMLParagraphElement>('#status')!;

function showStatus(message: string, kind: StatusKind = 'error') {
  status.textContent = message;
  status.className = kind;
}

// El panel solo ofrece las acciones de la página activa (REQ-001 RF-11, RF-12, RF-16; REQ-002 RF-01, RF-20;
// REQ-003 RF-01, RF-02).
// Con `activeTab`, `tab.url` llega al abrir el panel en cualquier web.
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
    } else if ((page.kind === 'web' || page.kind === 'document' || page.kind === 'unir') && tab?.id !== undefined) {
      document.body.classList.add('documents');
      document.querySelector<HTMLElement>('#documents-section')!.hidden = false;
      setupDocuments(tab.id, page, showStatus);
    } else {
      showStatus(NO_ACTIONS, 'info');
    }
  })
  .catch((error: unknown) => showStatus(error instanceof Error ? error.message : String(error)));
