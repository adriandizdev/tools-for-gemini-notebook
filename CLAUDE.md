# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Extensión de Chrome (Manifest V3), "NotebookLM Tools", que amplía NotebookLM desde un único panel. Exporta conversaciones a PDF **conservando el formato de fórmulas y ecuaciones** y añade como fuentes de un cuaderno vídeos y listas de YouTube (`specs/REQ-001-…`) los documentos PDF, Word y PowerPoint de cualquier web (`specs/REQ-002-…`) y los temas del visor de UNIR (`specs/REQ-003-…`). Está escrita en TypeScript con [WXT](https://wxt.dev) (sobre Vite). El PDF se genera con la impresión nativa de Chrome (`window.print()`), no con librerías de PDF; se eligió así por fidelidad de las fórmulas, a cambio de mostrar el diálogo de impresión.

## Comandos

```bash
npm install              # también ejecuta `wxt prepare` (genera .wxt/ con tipos y auto-imports)
npm run dev              # abre Chrome con la extensión cargada y recarga en caliente
npm run build            # build de producción en .output/chrome-mv3/ (cargable en chrome://extensions → "Cargar descomprimida")
npm run zip              # empaqueta para la Chrome Web Store
npm run compile          # comprobación de tipos (tsc --noEmit)
npm run lint             # oxlint con reglas que usan tipos (.oxlintrc.json)
npm run format           # Prettier (CI comprueba `npm run format:check`)
npm test                 # Vitest (entorno jsdom)
npx vitest run utils/extract.test.ts          # un solo archivo de tests
npx vitest run -t "conserva el HTML"           # un solo test por nombre
```

Si `tsc` se queja de tipos o globals de WXT (`defineContentScript`, `browser`), ejecuta `npx wxt prepare`.

El linter es oxlint con `oxlint-tsgolint` y no ESLint: `typescript-eslint` no admite TypeScript 7. El JSON sin esquema (YouTube, RPC de NotebookLM) se lee con `dig` (`utils/dig.ts`), sin `any`.

## Arquitectura

El popup (`entrypoints/popup/main.ts`) clasifica la URL de la pestaña activa con `classifyTab` (`utils/page.ts`) y muestra solo la acción que corresponde: exportar en `/notebook/…`, añadir en un vídeo o lista de YouTube, buscar documentos en cualquier otra web (o en un PDF abierto directamente), listar los temas en el visor de UNIR, o el mensaje M-10 en las páginas de NotebookLM y YouTube sin acción. Los dominios de NotebookLM y YouTube se definen en `utils/domains.ts` y sirven a la vez de `matches` del content script y de `host_permissions`. En las demás webs, `tab.url` llega gracias a `activeTab`.

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

### Añadir documentos de una web como fuente (REQ-002)

1. **Permiso:** el acceso a todas las webs es un `optional_host_permissions` (`ALL_WEBS`). Hace falta para pedir el tamaño de los documentos y descargarlos. Si falta, el panel solo muestra "Permitir buscar documentos" (`permissions.request`).
2. **Popup** (`entrypoints/popup/documents.ts`):
   - Inyecta `scanPage` (`utils/scan-page.ts`) con `scripting.executeScript`. Esa función debe ser **autocontenida**, sin imports, porque se serializa.
   - Filtra y quita duplicados por dirección con `utils/documents.ts`, y pinta el listado sin esperar a los tamaños.
   - Pide los tamaños con `HEAD` (6 en paralelo, 3 s como máximo cada uno) y fusiona con `mergeBySize`.
   - El nombre propuesto sale de `utils/document-name.ts`.
3. **Puerto `ADD_DOCUMENTS_PORT`** con el background, para recibir el estado de cada documento. Si el popup se cierra, el background termina igualmente y recuerda el último cuaderno usado.
4. **`utils/add-documents.ts`**: reglas puras: cupo, ya presentes por nombre, fallos sueltos y elección del mensaje M-12 a M-18.
5. **`utils/document-backend.ts`**: descarga el documento sin cookies (los documentos privados quedan fuera de alcance) y lo sube con el cliente de NotebookLM. Si la subida falla, borra la fuente. Al final la renombra para quitarle la extensión.

### Añadir temas del visor de UNIR (REQ-003)

Reutiliza todo REQ-002 (permiso, panel, puerto, `addDocuments`, mensajes). Cambia de dónde salen el listado y el PDF:

1. `classifyTab` devuelve `unir` en `/asignaturas/{s}/mis-temas[/{t}]` de `UNIR_VISOR_HOST`; las demás páginas del visor, `none` (M-10). No se busca con `scanPage`.
2. El popup inyecta `callVisorApi` (`utils/unir-page.ts`, **autocontenida**) para pedir `user-topics`; `utils/unir.ts` lo convierte en filas (título del tema como nombre, todas marcadas). La clave de cada fila es la dirección de la página del tema.
3. Cada `DocumentToAdd` de un tema lleva `unirTopic: {tabId, topicId}`. Al añadirlo, el background inyecta `callVisorApi` en esa pestaña para obtener `downloadUrl` (`resolveDocumentUrl` → `createDocumentBackend(…, resolveUrl)`), y lo descarga sin credenciales como cualquier documento.

**El token del campus nunca sale de la página** (SUP-07): la API solo se llama desde funciones inyectadas en la pestaña del visor. API verificada contra la página real el 2026-10-22:

- Sin cookies: `Authorization: Bearer` con la clave `access_token` del `sessionStorage` (angular-oauth2-oidc). Sin token, 401.
- `GET /api/v3/subjects/{id}/user-topics` → `{subjectTitle, topics[{topicId (número), title, groups}]}`, en el orden del visor. `topicId` es el mismo de la URL `/mis-temas/{topicId}`.
- `POST /api/v1/topics/{topicId}/download` con `{}` → `{filename, downloadUrl, …}`; `downloadUrl` (cms.unir.net) se descarga sin cookies ni token y no trae `content-length`.
- `utils/__fixtures__/unir/user-topics.json` tiene la forma real; solo los dos primeros temas son reales.

Los textos al usuario están en `utils/messages.ts` y son los aprobados en la tabla 6.1 de cada spec: no se cambian sin cambiar la spec.

Puntos clave:

- **Dominios:** NotebookLM se renombró a **Gemini Notebook** y ahora vive en `notebook.google.com`. Se mantiene también `notebooklm.google.com`. La lista de dominios está en `utils/domains.ts`.
- **`utils/notebooklm-api.ts` es el único sitio acoplado a los RPC internos de NotebookLM** (`batchexecute`; no hay API pública). Se verificó contra la página real el 2026-10-12 y los recortes están en `utils/__fixtures__/notebooklm-rpc/`. Si Google los cambia, actualiza el módulo y los fixtures juntos. Lo verificado:
  - La sesión se lee de la página de inicio (`SNlM0e`, `FdrFJe`, `cfb2h`). Sin sesión, la página no incluye `SNlM0e` (M-08).
  - `wXbhsf` lista los cuadernos con sus fuentes (id de YouTube y estado: 2 lista, 3 error) y los límites del plan; el índice 2 es el máximo de fuentes por cuaderno, que se usa para CB-01.
  - `izAoDd` añade varias URLs en una llamada y devuelve solo las aceptadas. Si se rechazan todas, responde con error `[9]`. **Los vídeos rechazados se quedan en el cuaderno como fuentes con error**, así que `source-backend.ts` las borra después con `tGMBJ`. NotebookLM no da el motivo; su interfaz dice que la transcripción no está disponible.
  - `wXbhsf` también trae el título de cada fuente (`s[1]`) y su tipo (`s[2][4]`: 3 PDF, 11 docx, 6 pptx). Verificado el 2026-10-21.
  - **Subida de ficheros (verificada el 2026-10-21):**
    1. `o4cbdc` registra la fuente (`[[[nombre, 3]], cuaderno, CLIENT_CONTEXT]`) y devuelve su id.
    2. `POST /upload/_/?authuser=0` con `x-goog-upload-command: start` y el cuerpo `{PROJECT_ID, SOURCE_NAME, SOURCE_ID}` devuelve `x-goog-upload-url`.
    3. Se envía el contenido a esa URL con `upload, finalize`.

    Detalles comprobados:
    - **El nombre debe acabar en una extensión admitida**; si no, el servidor responde "Unsupported file extension for file".
    - Solo se admiten `.pdf`, `.docx` y `.pptx`, no `.doc` ni `.ppt`.
    - Si la subida falla tras `o4cbdc`, la fuente queda colgada en estado 5.
    - NotebookLM permite fuentes repetidas con el mismo nombre.
    - `b7Wfje` (`[null, [id], [[[título]]], CLIENT_CONTEXT]`) renombra una fuente.
    - Sin verificar: qué pasa si NotebookLM rechaza el contenido de un fichero con extensión válida.
- **Listas de YouTube:** la página trae los primeros 100 vídeos como `lockupViewModel` en `ytInitialData` y el resto se pide a `/youtubei/v1/browse` con el token de `continuationItemViewModel`. Verificado el 2026-10-12. Sin verificar: si los vídeos privados o borrados aparecen en la lista o YouTube los oculta.

- **`utils/selectors.ts` es el único sitio acoplado al DOM de NotebookLM.** Los selectores se verificaron contra la página real el 2026-10-05. `utils/__fixtures__/notebooklm-chat.html` es un recorte real de ese DOM y es la base de los tests de extracción. Si Google cambia la UI, actualiza los selectores y el fixture juntos.
- **Las fórmulas viajan como LaTeX, no como HTML de KaTeX.** NotebookLM renderiza con KaTeX (solo salida HTML) y guarda el LaTeX en el atributo `data-math`. Volver a renderizar evita desajustes entre la versión de KaTeX de Google y el CSS empaquetado, recupera MathML y reduce mucho el tamaño. Esto último importa porque el HTML original ronda los 400 KB por respuesta y `storage.session` tiene un límite de unos 10 MB.
- **El saneado es obligatorio:** la página de impresión tiene acceso a las APIs de la extensión y recibe HTML de una web externa. La configuración de DOMPurify debe seguir permitiendo MathML, SVG, `img` con `data:` y atributos `style`/`class`/`data-*`.
- NotebookLM usa `div.paragraph` en lugar de `<p>`, y `<b>` en lugar de encabezados.
- Sin verificar todavía: si NotebookLM virtualiza los mensajes en conversaciones largas, y cómo renderiza listas, tablas y fórmulas en bloque.
- **Las librerías van empaquetadas.** MV3 prohíbe cargar código remoto, así que KaTeX (JS, CSS y fuentes) se incluye vía npm/Vite.
- El estilo del PDF (márgenes, saltos de página que no parten fórmulas ni tablas) está en `entrypoints/print/print.css`.
- Los tests usan **jsdom**, no happy-dom: DOMPurify no sanea correctamente bajo happy-dom.
