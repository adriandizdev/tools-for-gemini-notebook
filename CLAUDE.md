# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Extensión de Chrome (Manifest V3) que exporta conversaciones de NotebookLM a PDF **conservando el formato de fórmulas y ecuaciones**. Está escrita en TypeScript con [WXT](https://wxt.dev) (sobre Vite). El PDF se genera con la impresión nativa de Chrome (`window.print()`), no con librerías de PDF; se eligió así por fidelidad de las fórmulas, a cambio de mostrar el diálogo de impresión.

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
2. **Content script** (`entrypoints/content.ts`): responde con `extractConversation()`, que clona el HTML de cada mensaje, quita la interfaz (citas, botones, iconos), los comentarios y los atributos de Angular, y **sustituye cada fórmula por su LaTeX original** (`<span class="math-tex" data-display>`).
3. El popup filtra los mensajes según la casilla "Incluir mis preguntas" (`filterConversation`; la preferencia se recuerda en `browser.storage.local` bajo `EXPORT_OPTIONS_KEY`), guarda la conversación en `browser.storage.session` bajo `conversationStorageKey(id)` y abre `print.html?id=…`. Si solo hay respuestas, la página de impresión omite las etiquetas de rol.
4. **Página de impresión** (`entrypoints/print/`, página no listada): lee y borra la entrada de storage, sanea cada mensaje con DOMPurify, renderiza cada `.math-tex` con el KaTeX empaquetado (más `auto-render` como red de seguridad para LaTeX suelto), espera a `document.fonts.ready` y llama a `window.print()`.

Puntos clave:

- **Dominios:** NotebookLM se renombró a **Gemini Notebook** y ahora vive en `notebook.google.com`. Se mantiene también `notebooklm.google.com`. La lista de dominios está solo en los `matches` de `entrypoints/content.ts`, que además actúan como permisos de host. El popup no comprueba la URL: si el content script no responde, muestra el error.

- **`utils/selectors.ts` es el único sitio acoplado al DOM de NotebookLM.** Los selectores se verificaron contra la página real el 2026-10-05. `utils/__fixtures__/notebooklm-chat.html` es un recorte real de ese DOM y es la base de los tests de extracción. Si Google cambia la UI, actualiza los selectores y el fixture juntos.
- **Las fórmulas viajan como LaTeX, no como HTML de KaTeX.** NotebookLM renderiza con KaTeX (solo salida HTML) y guarda el LaTeX en el atributo `data-math`. Volver a renderizar evita desajustes entre la versión de KaTeX de Google y el CSS empaquetado, recupera MathML y reduce mucho el tamaño. Esto último importa porque el HTML original ronda los 400 KB por respuesta y `storage.session` tiene un límite de unos 10 MB.
- **El saneado es obligatorio:** la página de impresión tiene acceso a las APIs de la extensión y recibe HTML de una web externa. La configuración de DOMPurify debe seguir permitiendo MathML, SVG, `img` con `data:` y atributos `style`/`class`/`data-*`.
- NotebookLM usa `div.paragraph` en lugar de `<p>`, y `<b>` en lugar de encabezados.
- Sin verificar todavía: si NotebookLM virtualiza los mensajes en conversaciones largas, y cómo renderiza listas, tablas y fórmulas en bloque.
- **Las librerías van empaquetadas.** MV3 prohíbe cargar código remoto, así que KaTeX (JS, CSS y fuentes) se incluye vía npm/Vite.
- El estilo del PDF (márgenes, saltos de página que no parten fórmulas ni tablas) está en `entrypoints/print/print.css`.
- Los tests usan **jsdom**, no happy-dom: DOMPurify no sanea correctamente bajo happy-dom.
