import { describe, expect, it } from 'vitest';
import { MATH_CLASS, extractConversation } from './extract';
import fixtureHtml from './__fixtures__/notebooklm-chat.html?raw';

/** Carga un recorte real del DOM de NotebookLM. */
function loadFixture(): Document {
  const doc = document.implementation.createHTMLDocument('NotebookLM');
  doc.body.innerHTML = fixtureHtml;
  return doc;
}

/** Parsea el HTML de un mensaje para poder consultarlo. */
function parse(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('extractConversation (DOM real de NotebookLM)', () => {
  const conversation = extractConversation(loadFixture());
  const [user, assistant] = conversation.messages;

  it('extrae el título del cuaderno y los mensajes con su rol', () => {
    expect(conversation.title).toBe('Estadistica');
    expect(conversation.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(user!.html).toContain('Prepara una bateria de preguntas tipo test');
  });

  it('no incluye el resumen del cuaderno ni los separadores de fecha', () => {
    const all = conversation.messages.map((m) => m.html).join('');
    expect(all).not.toContain('fundamentos de la estadística');
    expect(all).not.toContain('martes, 24 de febrero');
  });

  it('reduce cada fórmula a su LaTeX original', () => {
    const body = parse(assistant!.html);
    const formulas = [...body.querySelectorAll<HTMLElement>(`.${MATH_CLASS}`)];

    expect(formulas.map((f) => f.textContent)).toEqual([
      '(A \\cup B)^c',
      'z = \\frac{x - \\mu}{\\sigma}',
      '\\sqrt{\\lambda}',
    ]);
    expect(formulas.every((f) => f.dataset.display === 'false')).toBe(true);
    expect(body.querySelector('.katex, img')).toBeNull();
  });

  it('elimina citas, botones, comentarios y atributos de Angular', () => {
    const html = assistant!.html;
    for (const noise of [
      'citation-marker',
      'mat-icon',
      'more_horiz',
      'Guardar en una nota',
      'Copiar respuesta',
      '_ngcontent',
      '_nghost',
      'jslog',
      'data-start-index',
      '<!--',
    ]) {
      expect(html).not.toContain(noise);
    }
  });

  it('conserva el texto y el formato de la respuesta', () => {
    const body = parse(assistant!.html);
    expect(body.querySelectorAll('.paragraph')).toHaveLength(3);
    expect(body.querySelector('b')?.textContent).toBe('Tema 1: Conceptos y términos');
    expect(body.textContent).toContain('Respuesta correcta: a');
    expect(body.textContent).toContain('Respuesta correcta: b');
  });
});
