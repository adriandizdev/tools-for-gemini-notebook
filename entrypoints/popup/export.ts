import {
  type Conversation,
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_OPTIONS_KEY,
  EXTRACT_CONVERSATION,
  type ExportOptions,
  conversationStorageKey,
  filterConversation,
} from '@/utils/conversation';

/** Acción "Exportar conversación a PDF" en una conversación de NotebookLM. */
export function setupExport(tabId: number, showError: (message: string) => void) {
  const button = document.querySelector<HTMLButtonElement>('#export')!;
  const includeUser = document.querySelector<HTMLInputElement>('#include-user')!;

  const currentOptions = (): ExportOptions => ({ includeUserMessages: includeUser.checked });

  const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

  loadOptions()
    .then((options) => {
      includeUser.checked = options.includeUserMessages;
    })
    // Si no se puede leer la preferencia, se queda la casilla como viene en el HTML.
    .catch(() => {});

  includeUser.addEventListener('change', () => {
    browser.storage.local
      .set({ [EXPORT_OPTIONS_KEY]: currentOptions() })
      .catch((error) => showError(errorText(error)));
  });

  async function onExport() {
    button.disabled = true;
    button.ariaBusy = 'true';
    showError('');
    try {
      await exportTab(tabId, currentOptions());
    } catch (error) {
      showError(errorText(error));
    } finally {
      button.disabled = false;
      button.ariaBusy = null;
    }
  }

  button.addEventListener('click', () => void onExport());
}

async function loadOptions(): Promise<ExportOptions> {
  const stored = (await browser.storage.local.get(EXPORT_OPTIONS_KEY))[EXPORT_OPTIONS_KEY];
  return { ...DEFAULT_EXPORT_OPTIONS, ...(stored as Partial<ExportOptions> | undefined) };
}

async function exportTab(tabId: number, options: ExportOptions) {
  // Si el content script no responde, la pestaña se abrió antes de instalar la extensión.
  let conversation: Conversation;
  try {
    conversation = await browser.tabs.sendMessage(tabId, { type: EXTRACT_CONVERSATION });
  } catch {
    throw new Error('Recarga la página de Gemini Notebook (NotebookLM) y vuelve a intentarlo.');
  }
  if (!conversation?.messages.length) {
    throw new Error('No se encontraron mensajes en la conversación.');
  }

  conversation = filterConversation(conversation, options);
  if (!conversation.messages.length) {
    throw new Error('No hay respuestas de NotebookLM en la conversación.');
  }

  const id = crypto.randomUUID();
  await browser.storage.session.set({ [conversationStorageKey(id)]: conversation });
  await browser.tabs.create({ url: `${browser.runtime.getURL('/print.html')}?id=${id}` });
}
