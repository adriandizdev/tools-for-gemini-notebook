import type { Conversation, ConversationMessage } from './conversation';
import { SELECTORS } from './selectors';

/** Clase de los marcadores de fórmula que la página de impresión renderiza con KaTeX. */
export const MATH_CLASS = 'math-tex';

/** Atributos de Angular/telemetría que solo inflan el HTML. */
const NOISE_ATTRIBUTE = /^(_ngcontent-|_nghost-|jslog$|data-start-index$)/;

/**
 * Extrae los mensajes de la conversación en orden de aparición.
 * Se copia el HTML ya renderizado (no texto plano) para conservar el formato,
 * pero cada fórmula se reduce a su LaTeX original: la página de impresión la
 * vuelve a renderizar con el KaTeX empaquetado.
 */
export function extractConversation(doc: Document = document): Conversation {
  const messageSelector = `${SELECTORS.userMessage}, ${SELECTORS.assistantMessage}`;

  const messages: ConversationMessage[] = [];
  for (const el of doc.querySelectorAll(messageSelector)) {
    const content = el.querySelector(SELECTORS.messageContent) ?? el;
    const clone = content.cloneNode(true) as Element;
    clone.querySelectorAll(SELECTORS.noise).forEach((n) => n.remove());
    replaceMath(clone);
    stripNoise(clone);

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

function replaceMath(root: Element) {
  for (const math of root.querySelectorAll<HTMLElement>(SELECTORS.math)) {
    const marker = root.ownerDocument.createElement('span');
    marker.className = MATH_CLASS;
    marker.dataset.display = String(math.querySelector('.katex-display') !== null);
    marker.textContent = math.dataset.math ?? '';
    math.replaceWith(marker);
  }
}

function stripNoise(root: Element) {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
  );
  const comments: ChildNode[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.COMMENT_NODE) {
      comments.push(node as ChildNode);
      continue;
    }
    const el = node as Element;
    for (const { name } of [...el.attributes]) {
      if (NOISE_ATTRIBUTE.test(name)) el.removeAttribute(name);
    }
  }
  comments.forEach((c) => c.remove());
}
