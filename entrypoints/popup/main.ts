import {
  type Conversation,
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_OPTIONS_KEY,
  EXTRACT_CONVERSATION,
  type ExportOptions,
  conversationStorageKey,
  filterConversation,
} from '@/utils/conversation';

const button = document.querySelector<HTMLButtonElement>('#export')!;
const includeUser = document.querySelector<HTMLInputElement>('#include-user')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

loadOptions().then((options) => {
  includeUser.checked = options.includeUserMessages;
});

includeUser.addEventListener('change', () => {
  browser.storage.local.set({ [EXPORT_OPTIONS_KEY]: currentOptions() });
});

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = '';
  try {
    await exportActiveTab(currentOptions());
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    button.disabled = false;
  }
});

function currentOptions(): ExportOptions {
  return { includeUserMessages: includeUser.checked };
}

async function loadOptions(): Promise<ExportOptions> {
  const stored = (await browser.storage.local.get(EXPORT_OPTIONS_KEY))[EXPORT_OPTIONS_KEY];
  return { ...DEFAULT_EXPORT_OPTIONS, ...(stored as Partial<ExportOptions> | undefined) };
}

async function exportActiveTab(options: ExportOptions) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  // Los dominios admitidos se definen solo en entrypoints/content.ts: si el content
  // script no responde, la pestaña no es un cuaderno o se abrió antes de instalar la extensión.
  const notANotebook = new Error(
    'Abre una conversación de Gemini Notebook (NotebookLM) en esta pestaña. Si ya la tienes abierta, recarga la página.',
  );
  if (tab?.id === undefined) throw notANotebook;

  let conversation: Conversation;
  try {
    conversation = await browser.tabs.sendMessage(tab.id, { type: EXTRACT_CONVERSATION });
  } catch {
    throw notANotebook;
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
