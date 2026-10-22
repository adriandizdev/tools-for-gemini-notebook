import { describe, expect, it } from 'vitest';
import { sanitizeMessageHtml } from './sanitize';

describe('sanitizeMessageHtml', () => {
  it('elimina scripts y manejadores de eventos', () => {
    const html = sanitizeMessageHtml(
      '<p>Hola</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).toContain('<p>Hola</p>');
  });

  it('conserva el marcado de KaTeX (clases, estilos, MathML y SVG)', () => {
    const katex =
      '<span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>x</mi></mrow></semantics></math></span>' +
      '<span class="katex-html" aria-hidden="true"><span class="strut" style="height:0.43em;"></span>' +
      '<svg width="400em" height="1em" viewBox="0 0 400000 1000"><path d="M0 0h400000"></path></svg></span></span>';
    const html = sanitizeMessageHtml(katex);
    expect(html).toContain('class="katex-html"');
    expect(html).toContain('style="height:0.43em;"');
    expect(html).toContain('<math>');
    expect(html).toContain('<svg');
  });

  it('conserva los marcadores de fórmula extraídos', () => {
    const html = sanitizeMessageHtml(
      '<span class="math-tex" data-display="false">\\frac{a}{b}</span>',
    );
    expect(html).toBe('<span class="math-tex" data-display="false">\\frac{a}{b}</span>');
  });

  it('conserva las imágenes SVG en data: que KaTeX usa para raíces', () => {
    const html = sanitizeMessageHtml(
      '<img class="katex-svg" src="data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E">',
    );
    expect(html).toContain('src="data:image/svg+xml;utf8,');
  });
});
