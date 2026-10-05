import { describe, expect, it } from 'vitest';
import { extractConversation } from './extract';
import { SELECTORS } from './selectors';

const cls = (selector: string) => selector.replace(/^\./, '');

function makeDocument(body: string): Document {
  const doc = document.implementation.createHTMLDocument('Mi cuaderno');
  doc.body.innerHTML = body;
  return doc;
}

describe('extractConversation', () => {
  it('extrae los mensajes en orden y con su rol', () => {
    const doc = makeDocument(`
      <div class="${cls(SELECTORS.userMessage)}"><div class="${cls(SELECTORS.messageContent)}">¿Qué es la entropía?</div></div>
      <div class="${cls(SELECTORS.assistantMessage)}"><div class="${cls(SELECTORS.messageContent)}"><p>Es una medida…</p></div></div>
    `);

    const { title, messages } = extractConversation(doc);

    expect(title).toBe('Mi cuaderno');
    expect(messages).toEqual([
      { role: 'user', html: '¿Qué es la entropía?' },
      { role: 'assistant', html: '<p>Es una medida…</p>' },
    ]);
  });

  it('conserva el HTML de las fórmulas y elimina los controles de la interfaz', () => {
    const formula = '<span class="katex"><math><mi>x</mi></math><span aria-hidden="true">x</span></span>';
    const doc = makeDocument(`
      <div class="${cls(SELECTORS.assistantMessage)}">
        <div class="${cls(SELECTORS.messageContent)}">${formula}<button>Copiar</button></div>
      </div>
    `);

    const [message] = extractConversation(doc).messages;

    expect(message).toBeDefined();
    expect(message!.html).toContain('<span class="katex">');
    expect(message!.html).toContain('<math>');
    expect(message!.html).not.toContain('Copiar');
  });

  it('ignora mensajes vacíos', () => {
    const doc = makeDocument(`<div class="${cls(SELECTORS.assistantMessage)}"><button>…</button></div>`);
    expect(extractConversation(doc).messages).toEqual([]);
  });
});
