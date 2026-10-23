import { NO_ACTIONS } from '@/utils/messages';
import { classifyTab } from '@/utils/page';
import { setupAccounts } from './accounts';
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
// Con `activeTab`, `tab.url` llega al abrir el panel en cualquier web. Las acciones de importar
// trabajan con la cuenta activa (REQ-004, RF-01); exportar no depende de la cuenta.
browser.tabs
  .query({ active: true, currentWindow: true })
  .then(async ([tab]) => {
    const page = classifyTab(tab?.url);
    if (page.kind === 'notebook' && tab?.id !== undefined) {
      document.querySelector<HTMLElement>('#export-section')!.hidden = false;
      setupExport(tab.id, showStatus);
    } else if (page.kind === 'video' || page.kind === 'playlist') {
      const section = document.querySelector<HTMLElement>('#add-section')!;
      section.hidden = false;
      const accounts = await setupAccounts(section, showStatus);
      if (accounts) setupAdd(page, accounts, showStatus);
    } else if (
      (page.kind === 'web' || page.kind === 'document' || page.kind === 'unir') &&
      tab?.id !== undefined
    ) {
      document.body.classList.add('documents');
      const section = document.querySelector<HTMLElement>('#documents-section')!;
      section.hidden = false;
      const accounts = await setupAccounts(section, showStatus);
      if (accounts) setupDocuments(tab.id, page, accounts, showStatus);
    } else {
      document.body.classList.add('empty');
      showStatus(NO_ACTIONS, 'info');
    }
  })
  .catch((error: unknown) => showStatus(error instanceof Error ? error.message : String(error)));
