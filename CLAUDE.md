# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Extensión de Chrome (Manifest V3), "NotebookLM Tools", que amplía NotebookLM desde un único panel. Exporta conversaciones a PDF **conservando el formato de fórmulas y ecuaciones** y añade vídeos y listas de YouTube como fuentes de un cuaderno (`specs/REQ-001-…`). Está escrita en TypeScript con [WXT](https://wxt.dev) (sobre Vite). El PDF se genera con la impresión nativa de Chrome (`window.print()`), no con librerías de PDF; se eligió así por fidelidad de las fórmulas, a cambio de mostrar el diálogo de impresión.

## Comandos

```bash
npm install              # también ejecuta `wxt prepare` (genera .wxt/ con tipos y auto-imports)
npm run dev              # abre Chrome con la extensión cargada y recarga en caliente
npm run build            # build de producción en .output/chrome-mv3/ (cargable en chrome://extensions → "Cargar descomprimida")
npm run zip              # empaqueta para la Chrome Web Store
npm run compile          # comprobación de tipos (tsc --noEmit)
npm run lint             # oxlint con reglas que usan tipos (.oxlintrc.json)
npm test                 # Vitest (entorno jsdom)
npx vitest run utils/extract.test.ts          # un solo archivo de tests
npx vitest run -t "conserva el HTML"           # un solo test por nombre
```

Si `tsc` se queja de tipos o globals de WXT (`defineContentScript`, `browser`), ejecuta `npx wxt prepare`.

El linter es oxlint con `oxlint-tsgolint` y no ESLint: `typescript-eslint` no admite TypeScript 7. El JSON sin esquema (YouTube, RPC de NotebookLM) se lee con `dig` (`utils/dig.ts`), sin `any`.

## Arquitectura

El popup (`entrypoints/popup/main.ts`) clasifica la URL de la pestaña activa con `classifyTab` (`utils/page.ts`) y muestra solo la acción que corresponde: exportar en `/notebook/…`, añadir en un vídeo o lista de YouTube, o el mensaje M-10 en cualquier otra web. `tab.url` solo es legible en los dominios con host permission, que se definen en `utils/domains.ts` y sirven a la vez de `matches` del content script y de `host_permissions`.

### Exportar a PDF

Flujo repartido entre tres contextos de la extensión:

1. **Popup** (`entrypoints/popup/export.ts`): al pulsar el botón, envía `EXTRACT_CONVERSATION` al content script de la pestaña activa.
2. **Content script** (`entrypoints/content.ts`): responde con `extractConversation()`, que clona el HTML de cada mensaje, quita la interfaz (citas, botones, iconos), los comentarios y los atributos de Angular, y **sustituye cada fórmula por su LaTeX original** (`<span class="math-tex" data-display>`).
3. El popup filtra los mensajes según la casilla "Incluir mis preguntas" (`filterConversation`; la preferencia se recuerda en `browser.storage.local` bajo `EXPORT_OPTIONS_KEY`), guarda la conversación en `browser.storage.session` bajo `conversationStorageKey(id)` y abre `print.html?id=…`. Si solo hay respuestas, la página de impresión omite las etiquetas de rol.
4. **Página de impresión** (`entrypoints/print/`, página no listada): lee y borra la entrada de storage, sanea cada mensaje con DOMPurify, renderiza cada `.math-tex` con el KaTeX empaquetado (más `auto-render` como red de seguridad para LaTeX suelto), espera a `document.fonts.ready` y llama a `window.print()`.

### Añadir vídeos de YouTube como fuente (REQ-001)

1. **Popup** (`entrypoints/popup/add.ts`): "Añadir a cuaderno" pide `LIST_NOTEBOOKS` al background en cada apertura y preselecciona el último cuaderno usado (`LAST_NOTEBOOK_KEY` en `storage.local`), solo si sigue existiendo. Al confirmar envía `ADD_TO_NOTEBOOK` y recuerda el cuaderno si se añadió algo.
2. **Background** (`entrypoints/background.ts`): hace las llamadas con las cookies del usuario, para no depender del popup, que se cierra al perder el foco.
3. **`utils/add-sources.ts`**: reglas de negocio puras (duplicados, cupo, recuentos, elección del mensaje M-xx), con el acceso a NotebookLM y YouTube inyectado (`SourceBackend`).
4. **`utils/source-backend.ts`**: implementa `SourceBackend` sobre el cliente de NotebookLM y `utils/youtube-playlist.ts`.

Los textos al usuario están en `utils/messages.ts` y son los aprobados en la tabla 6.1 de la spec: no se cambian sin cambiar la spec.

Puntos clave:

- **Dominios:** NotebookLM se renombró a **Gemini Notebook** y ahora vive en `notebook.google.com`. Se mantiene también `notebooklm.google.com`. La lista de dominios está en `utils/domains.ts`.
- **`utils/notebooklm-api.ts` es el único sitio acoplado a los RPC internos de NotebookLM** (`batchexecute`; no hay API pública). Se verificó contra la página real el 2026-10-12 y los recortes están en `utils/__fixtures__/notebooklm-rpc/`. Si Google los cambia, actualiza el módulo y los fixtures juntos. Lo verificado:
  - La sesión se lee de la página de inicio (`SNlM0e`, `FdrFJe`, `cfb2h`). Sin sesión, la página no incluye `SNlM0e` (M-08).
  - `wXbhsf` lista los cuadernos con sus fuentes (id de YouTube y estado: 2 lista, 3 error) y los límites del plan; el índice 2 es el máximo de fuentes por cuaderno, que se usa para CB-01.
  - `izAoDd` añade varias URLs en una llamada y devuelve solo las aceptadas. Si se rechazan todas, responde con error `[9]`. **Los vídeos rechazados se quedan en el cuaderno como fuentes con error**, así que `source-backend.ts` las borra después con `tGMBJ`. NotebookLM no da el motivo; su interfaz dice que la transcripción no está disponible.
- **Listas de YouTube:** la página trae los primeros 100 vídeos como `lockupViewModel` en `ytInitialData` y el resto se pide a `/youtubei/v1/browse` con el token de `continuationItemViewModel`. Verificado el 2026-10-12. Sin verificar: si los vídeos privados o borrados aparecen en la lista o YouTube los oculta.

- **`utils/selectors.ts` es el único sitio acoplado al DOM de NotebookLM.** Los selectores se verificaron contra la página real el 2026-10-05. `utils/__fixtures__/notebooklm-chat.html` es un recorte real de ese DOM y es la base de los tests de extracción. Si Google cambia la UI, actualiza los selectores y el fixture juntos.
- **Las fórmulas viajan como LaTeX, no como HTML de KaTeX.** NotebookLM renderiza con KaTeX (solo salida HTML) y guarda el LaTeX en el atributo `data-math`. Volver a renderizar evita desajustes entre la versión de KaTeX de Google y el CSS empaquetado, recupera MathML y reduce mucho el tamaño. Esto último importa porque el HTML original ronda los 400 KB por respuesta y `storage.session` tiene un límite de unos 10 MB.
- **El saneado es obligatorio:** la página de impresión tiene acceso a las APIs de la extensión y recibe HTML de una web externa. La configuración de DOMPurify debe seguir permitiendo MathML, SVG, `img` con `data:` y atributos `style`/`class`/`data-*`.
- NotebookLM usa `div.paragraph` en lugar de `<p>`, y `<b>` en lugar de encabezados.
- Sin verificar todavía: si NotebookLM virtualiza los mensajes en conversaciones largas, y cómo renderiza listas, tablas y fórmulas en bloque.
- **Las librerías van empaquetadas.** MV3 prohíbe cargar código remoto, así que KaTeX (JS, CSS y fuentes) se incluye vía npm/Vite.
- El estilo del PDF (márgenes, saltos de página que no parten fórmulas ni tablas) está en `entrypoints/print/print.css`.
- Los tests usan **jsdom**, no happy-dom: DOMPurify no sanea correctamente bajo happy-dom.
