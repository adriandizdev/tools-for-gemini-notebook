import { EXTRACT_CONVERSATION } from '@/utils/conversation';
import { extractConversation } from '@/utils/extract';

export default defineContentScript({
  matches: ['https://notebooklm.google.com/*'],
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === EXTRACT_CONVERSATION) {
        sendResponse(extractConversation());
      }
    });
  },
});
