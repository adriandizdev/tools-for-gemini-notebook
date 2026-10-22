# Protocolos verificados

Notas de lo comprobado contra las páginas reales de NotebookLM, YouTube y el visor de UNIR. Ninguna de estas interfaces es pública: si Google o UNIR las cambian, actualiza a la vez el módulo, sus fixtures y este documento.

## RPC de NotebookLM

`utils/notebooklm-api.ts` es el único módulo que los conoce (`batchexecute`). Verificados el 2026-10-12; los recortes están en `utils/__fixtures__/notebooklm-rpc/`.

- La sesión se lee de la página de inicio (`SNlM0e`, `FdrFJe`, `cfb2h`). Sin sesión, la página no incluye `SNlM0e` (M-08).
- `wXbhsf` lista los cuadernos con sus fuentes (id de YouTube y estado: 2 lista, 3 error) y los límites del plan; el índice 2 es el máximo de fuentes por cuaderno, que se usa para CB-01.
- `wXbhsf` también trae el título de cada fuente (`s[1]`) y su tipo (`s[2][4]`: 3 PDF, 11 docx, 6 pptx). Verificado el 2026-10-21.
- `izAoDd` añade varias URLs en una llamada y devuelve solo las aceptadas. Si se rechazan todas, responde con error `[9]`. **Los vídeos rechazados se quedan en el cuaderno como fuentes con error**, así que `source-backend.ts` las borra después con `tGMBJ`. NotebookLM no da el motivo; su interfaz dice que la transcripción no está disponible.

### Subida de ficheros

Verificada el 2026-10-21:

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

## DOM de NotebookLM

`utils/selectors.ts` es el único módulo acoplado al DOM. Selectores verificados el 2026-10-05; `utils/__fixtures__/notebooklm-chat.html` es un recorte real y la base de los tests de extracción.

- NotebookLM renderiza las fórmulas con KaTeX (solo salida HTML) y guarda el LaTeX en el atributo `data-math`. El HTML original ronda los 400 KB por respuesta.
- Usa `div.paragraph` en lugar de `<p>`, y `<b>` en lugar de encabezados.
- Sin verificar: si virtualiza los mensajes en conversaciones largas, y cómo renderiza listas, tablas y fórmulas en bloque.

## Listas de YouTube

Verificado el 2026-10-12. La página trae los primeros 100 vídeos como `lockupViewModel` en `ytInitialData` y el resto se pide a `/youtubei/v1/browse` con el token de `continuationItemViewModel`.

Sin verificar: si los vídeos privados o borrados aparecen en la lista o YouTube los oculta.

## API del visor de UNIR

Verificada contra la página real el 2026-10-22 (asignatura 3128028). Solo se llama desde funciones inyectadas en la pestaña del visor (`utils/unir-page.ts`), para que el token no salga de ella (SUP-07).

- Las páginas son `/asignaturas/{subjectId}/mis-temas` (listado) y `/asignaturas/{subjectId}/mis-temas/{topicId}` (un tema). Es una SPA de Angular.
- Los PDF no están enlazados en el DOM, así que `scanPage` de REQ-002 no los encuentra.
- Sin cookies: `Authorization: Bearer` con la clave `access_token` del `sessionStorage` (angular-oauth2-oidc). Sin token, 401 "Missing bearer token".
- `GET /api/v3/subjects/{id}/user-topics` → `{subjectTitle, topics[{topicId (número), title, groups[{title, sections}]}]}`, en el orden del visor. `topicId` es el mismo de la URL `/mis-temas/{topicId}`.
- `POST /api/v1/topics/{topicId}/download` con `{}` → `{filename, pdfPages, fileSize, downloadUrl, status}`. Un PDF por tema. `downloadUrl` (cms.unir.net) se descarga sin cookies ni token y no trae `content-length`.
- `POST /api/v1/subjects/{id}/topics/download` devuelve un ZIP con todos los temas (fuera de alcance en REQ-003).
- `utils/__fixtures__/unir/user-topics.json` tiene la forma real; solo los dos primeros temas son reales.
