import { EXTRACT_CONVERSATION } from '@/utils/conversation';
import { extractConversation } from '@/utils/extract';

export default defineContentScript({
  // NotebookLM ahora es "Gemini Notebook" (notebook.google.com); se mantiene el dominio antiguo.
  matches: ['https://notebook.google.com/*', 'https://notebooklm.google.com/*'],
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === EXTRACT_CONVERSATION) {
        sendResponse(extractConversation());
      }
    });
  },
});
