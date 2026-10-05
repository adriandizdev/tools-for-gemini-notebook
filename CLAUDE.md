# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Extensión de Chrome (Manifest V3) que exporta conversaciones de NotebookLM (`notebooklm.google.com`) a PDF **conservando el formato de fórmulas y ecuaciones**. Está escrita en TypeScript con [WXT](https://wxt.dev) (sobre Vite). El PDF se genera con la impresión nativa de Chrome (`window.print()`), no con librerías de PDF; se eligió así por fidelidad de las fórmulas, a cambio de mostrar el diálogo de impresión.

## Comandos

```bash
npm install              # también ejecuta `wxt prepare` (genera .wxt/ con tipos y auto-imports)
npm run dev              # abre Chrome con la extensión cargada y recarga en caliente
npm run build            # build de producción en .output/chrome-mv3/ (cargable en chrome://extensions → "Cargar descomprimida")
npm run zip              # empaqueta para la Chrome Web Store
npm run compile          # comprobación de tipos (tsc --noEmit)
npm test                 # Vitest (entorno jsdom)
npx vitest run utils/extract.test.ts          # un solo archivo de tests
npx vitest run -t "conserva el HTML"           # un solo test por nombre
```

Si `tsc` se queja de tipos o globals de WXT (`defineContentScript`, `browser`), ejecuta `npx wxt prepare`.

## Arquitectura

Flujo de exportación, repartido entre tres contextos de la extensión:

1. **Popup** (`entrypoints/popup/`): al pulsar el botón, envía `EXTRACT_CONVERSATION` al content script de la pestaña activa.
2. **Content script** (`entrypoints/content.ts`, solo en `notebooklm.google.com`): responde con `extractConversation()`, que clona el **HTML ya renderizado** de cada mensaje (fórmulas incluidas) en vez de texto plano.
3. El popup guarda la conversación en `browser.storage.session` bajo `conversationStorageKey(id)` y abre `print.html?id=…`.
4. **Página de impresión** (`entrypoints/print/`, página no listada): lee y borra la entrada de storage, sanea cada mensaje con DOMPurify, carga el CSS y las fuentes de KaTeX empaquetados, renderiza con `katex/contrib/auto-render` solo el LaTeX que haya llegado sin procesar, espera a `document.fonts.ready` y llama a `window.print()`.

Puntos clave:

- **`utils/selectors.ts` es el único sitio acoplado al DOM de NotebookLM.** Los selectores actuales **no están verificados** contra la página real. Si la extracción no encuentra mensajes, el fallo casi siempre está ahí. Los tests construyen su DOM a partir de esas mismas constantes, así que pasar los tests no garantiza que funcione en NotebookLM.
- **El saneado es obligatorio:** la página de impresión tiene acceso a las APIs de la extensión y recibe HTML de una web externa. La configuración de DOMPurify debe seguir permitiendo MathML, SVG y atributos `style`/`class`, porque KaTeX los necesita.
- **Las librerías van empaquetadas.** MV3 prohíbe cargar código remoto, así que KaTeX (JS, CSS y fuentes) se incluye vía npm/Vite.
- El estilo del PDF (márgenes, saltos de página que no parten fórmulas ni tablas) está en `entrypoints/print/print.css`.
- Los tests usan **jsdom**, no happy-dom: DOMPurify no sanea correctamente bajo happy-dom.
