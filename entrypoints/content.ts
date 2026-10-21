import { EXTRACT_CONVERSATION } from '@/utils/conversation';
import { NOTEBOOKLM_MATCHES } from '@/utils/domains';
import { extractConversation } from '@/utils/extract';

export default defineContentScript({
  matches: NOTEBOOKLM_MATCHES,
  main() {
    browser.runtime.onMessage.addListener((message: { type?: unknown } | undefined, _sender, sendResponse) => {
      if (message?.type === EXTRACT_CONVERSATION) {
        sendResponse(extractConversation());
      }
    });
  },
});
