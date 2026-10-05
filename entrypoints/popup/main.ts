import {
  type Conversation,
  EXTRACT_CONVERSATION,
  conversationStorageKey,
} from '@/utils/conversation';

const button = document.querySelector<HTMLButtonElement>('#export')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = '';
  try {
    await exportActiveTab();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    button.disabled = false;
  }
});

async function exportActiveTab() {
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

  const id = crypto.randomUUID();
  await browser.storage.session.set({ [conversationStorageKey(id)]: conversation });
  await browser.tabs.create({ url: `${browser.runtime.getURL('/print.html')}?id=${id}` });
}
