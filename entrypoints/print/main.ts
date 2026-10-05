import 'katex/dist/katex.min.css';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';
import './print.css';
import { type Conversation, conversationStorageKey } from '@/utils/conversation';
import { MATH_CLASS } from '@/utils/extract';
import { sanitizeMessageHtml } from '@/utils/sanitize';

const ROLE_LABEL = { user: 'Tú', assistant: 'NotebookLM' } as const;

async function main() {
  const id = new URLSearchParams(location.search).get('id');
  const container = document.querySelector<HTMLElement>('#conversation')!;
  if (!id) {
    container.textContent = 'Falta el identificador de la conversación.';
    return;
  }

  const key = conversationStorageKey(id);
  const conversation = (await browser.storage.session.get(key))[key] as Conversation | undefined;
  if (!conversation) {
    container.textContent = 'La conversación ya no está disponible. Vuelve a exportarla desde NotebookLM.';
    return;
  }
  await browser.storage.session.remove(key);

  document.title = conversation.title;
  document.querySelector('#title')!.textContent = conversation.title;
  document.querySelector('#meta')!.textContent = new Date().toLocaleString();

  for (const message of conversation.messages) {
    const article = document.createElement('article');
    article.className = `message message--${message.role}`;
    const label = document.createElement('div');
    label.className = 'message__role';
    label.textContent = ROLE_LABEL[message.role];
    const body = document.createElement('div');
    body.className = 'message__body';
    body.innerHTML = sanitizeMessageHtml(message.html);
    article.append(label, body);
    container.append(article);
  }

  // Las fórmulas llegan como LaTeX (extraído de data-math) y se renderizan con el
  // KaTeX empaquetado, que coincide con el CSS y las fuentes cargados arriba.
  for (const el of container.querySelectorAll<HTMLElement>(`.${MATH_CLASS}`)) {
    katex.render(el.textContent ?? '', el, {
      displayMode: el.dataset.display === 'true',
      throwOnError: false,
    });
  }
  // Red de seguridad para LaTeX que haya llegado como texto suelto.
  renderMathInElement(container, { ignoredClasses: ['katex'], throwOnError: false });

  // Esperar a las fuentes de KaTeX para que no se impriman con la fuente de reserva.
  await document.fonts.ready;
  window.print();
}

main();
