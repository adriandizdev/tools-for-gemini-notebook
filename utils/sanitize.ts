import DOMPurify from 'dompurify';

/**
 * Sanea el HTML extraído antes de insertarlo en la página de impresión, que es
 * una página de la extensión con acceso a las APIs de Chrome. Se permiten MathML
 * y SVG porque KaTeX los usa para dibujar las fórmulas.
 */
export function sanitizeMessageHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
  });
}
