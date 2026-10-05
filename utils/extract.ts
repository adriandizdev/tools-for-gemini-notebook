import type { Conversation, ConversationMessage } from './conversation';
import { SELECTORS } from './selectors';

/**
 * Extrae los mensajes de la conversación en orden de aparición.
 * Se copia el HTML ya renderizado (incluidas las fórmulas KaTeX/MathML) en lugar
 * de texto plano, para conservar el formato en el PDF.
 */
export function extractConversation(doc: Document = document): Conversation {
  const messageSelector = `${SELECTORS.userMessage}, ${SELECTORS.assistantMessage}`;

  const messages: ConversationMessage[] = [];
  for (const el of doc.querySelectorAll(messageSelector)) {
    const content = el.querySelector(SELECTORS.messageContent) ?? el;
    const clone = content.cloneNode(true) as Element;
    clone.querySelectorAll(SELECTORS.noise).forEach((n) => n.remove());

    const html = clone.innerHTML.trim();
    if (!html) continue;
    messages.push({
      role: el.matches(SELECTORS.userMessage) ? 'user' : 'assistant',
      html,
    });
  }

  const title =
    doc.querySelector(SELECTORS.notebookTitle)?.textContent?.trim() || doc.title || 'NotebookLM';

  return { title, url: doc.location?.href ?? '', messages };
}
