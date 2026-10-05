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
  // La URL solo es visible para pestañas cubiertas por los permisos de host.
  if (!tab?.id || !tab.url?.startsWith('https://notebooklm.google.com/')) {
    throw new Error('Abre una conversación de NotebookLM en la pestaña actual.');
  }

  let conversation: Conversation;
  try {
    conversation = await browser.tabs.sendMessage(tab.id, { type: EXTRACT_CONVERSATION });
  } catch {
    throw new Error('No se pudo leer la página. Recarga la pestaña de NotebookLM e inténtalo de nuevo.');
  }
  if (!conversation?.messages.length) {
    throw new Error('No se encontraron mensajes en la conversación.');
  }

  const id = crypto.randomUUID();
  await browser.storage.session.set({ [conversationStorageKey(id)]: conversation });
  await browser.tabs.create({ url: `${browser.runtime.getURL('/print.html')}?id=${id}` });
}
