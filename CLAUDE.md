# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Extensión de Chrome (Manifest V3), "Tools for Gemini Notebook", escrita en TypeScript con [WXT](https://wxt.dev). Exporta conversaciones de NotebookLM a PDF **conservando las fórmulas** (con `window.print()`, no con librerías de PDF, por fidelidad) y añade como fuentes de un cuaderno vídeos y listas de YouTube (`specs/REQ-001-…`), documentos PDF/Word/PowerPoint de cualquier web (`specs/REQ-002-…`) y temas del visor de UNIR (`specs/REQ-003-…`).

- Arquitectura y flujos: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- Lo verificado de las APIs internas (RPC de NotebookLM, DOM, YouTube, UNIR): [`docs/PROTOCOLOS.md`](docs/PROTOCOLOS.md). Léelo antes de tocar esos módulos.

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
npm run test:coverage    # Vitest con cobertura en coverage/ (lcov para SonarQube Cloud, que se ejecuta en CI)
npx vitest run utils/extract.test.ts          # un solo archivo de tests
npx vitest run -t "conserva el HTML"           # un solo test por nombre
```

Si `tsc` se queja de tipos o globals de WXT (`defineContentScript`, `browser`), ejecuta `npx wxt prepare`.

El linter es oxlint con `oxlint-tsgolint` y no ESLint: `typescript-eslint` no admite TypeScript 7. El JSON sin esquema (YouTube, RPC de NotebookLM) se lee con `dig` (`utils/dig.ts`), sin `any`.

## Reglas

- **Dominios:** NotebookLM se renombró a Gemini Notebook (`notebook.google.com`); se mantiene también `notebooklm.google.com`. La lista está en `utils/domains.ts` y sirve de `matches` y de `host_permissions`.
- **Acoplamiento a Google en un solo sitio:** `utils/notebooklm-api.ts` (RPC) y `utils/selectors.ts` (DOM). Si Google cambia algo, actualiza el módulo, sus fixtures (`utils/__fixtures__/`) y `docs/PROTOCOLOS.md` juntos.
- **Las reglas de negocio son puras** (`utils/add-sources.ts`, `utils/add-documents.ts`) y reciben el acceso a NotebookLM y YouTube como backend inyectado. Las llamadas se hacen desde el background, que sigue vivo aunque el popup se cierre.
- **Funciones inyectadas autocontenidas:** `scanPage` (`utils/injected/scan-page.ts`) y `callVisorApi` (`utils/injected/unir-page.ts`) se serializan con `scripting.executeScript`; no pueden tener imports (oxlint lo impide en `utils/injected/`).
- **El token del campus de UNIR nunca sale de la pestaña del visor** (SUP-07): su API solo se llama desde `callVisorApi`.
- **Cuentas (REQ-004):** cada petición al background lleva la cuenta (`Account`: correo y `authuser`) y el cliente comprueba que la sesión es de esa cuenta. El manifest usa `incognito: "split"` para que en incógnito solo cuenten las sesiones de incógnito.
- **Subidas a NotebookLM:** solo `.pdf`, `.docx` y `.pptx`, y el nombre debe acabar en la extensión (después se renombra para quitarla).
- **Las fórmulas viajan como LaTeX, no como HTML de KaTeX:** se vuelven a renderizar con el KaTeX empaquetado. Evita desajustes de versión, recupera MathML y reduce el tamaño (~400 KB por respuesta frente al límite de ~10 MB de `storage.session`).
- **El saneado con DOMPurify es obligatorio** en la página de impresión, que tiene acceso a las APIs de la extensión y recibe HTML externo. Debe seguir permitiendo MathML, SVG, `img` con `data:` y `style`/`class`/`data-*`.
- **Nada de código remoto (MV3):** KaTeX (JS, CSS y fuentes) va empaquetado vía npm/Vite.
- **Textos al usuario:** están en `utils/strings.ts` y son los aprobados en la tabla 6.1 de cada spec; no se cambian sin cambiar la spec.
- **Tests con jsdom**, no happy-dom: DOMPurify no sanea correctamente bajo happy-dom.
