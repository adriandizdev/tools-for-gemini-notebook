# Ficha de la Chrome Web Store

Textos para pegar en el [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Si cambian los permisos o los datos que se tocan, actualiza también [`PRIVACY.md`](../PRIVACY.md).

## Ficha de Play Store

- **Nombre:** se toma del manifest (`Tools for Gemini Notebook`).
- **Resumen:** se toma del `description` del manifest (máx. 132 caracteres).
- **Categoría:** Productividad › Herramientas.
- **Idioma:** español.

### Descripción

```text
Amplía Gemini Notebook (antes NotebookLM) desde un único panel.

EXPORTAR A PDF CON FÓRMULAS
En un cuaderno, exporta la conversación a PDF conservando las fórmulas matemáticas. Puedes incluir o quitar tus preguntas.

AÑADIR FUENTES SIN SALIR DE LA PÁGINA
• YouTube: añade un vídeo o una lista de reproducción entera. Omite los vídeos que ya están y respeta el máximo de fuentes de tu plan.
• Cualquier web: encuentra los PDF, Word y PowerPoint enlazados, muestra su tamaño y sube los que elijas.
• Campus de UNIR: lista los temas de la asignatura y añade sus PDF.

VARIAS CUENTAS
Si tienes varias cuentas de Google con la sesión iniciada, elige con cuál trabajar.

PRIVACIDAD
Sin servidor propio, sin analítica y sin publicidad. Todo ocurre en tu navegador, entre tú y los servicios que ya usas. El acceso a todas las webs es opcional y solo se pide al buscar documentos.

AVISO
Proyecto personal y no oficial. No tiene relación con Google, YouTube ni la Universidad Internacional de La Rioja (UNIR), ni cuenta con su respaldo. NotebookLM, Gemini y YouTube son marcas de Google LLC.

Código fuente: https://github.com/adriandizdev/tools-for-gemini-notebook
```

### Recursos gráficos

| Recurso                     | Tamaño             | Estado                |
| --------------------------- | ------------------ | --------------------- |
| Icono                       | 128×128            | `public/icon/128.png` |
| Capturas (1–5)              | 1280×800 o 640×400 | Pendiente             |
| Mosaico promocional pequeño | 440×280            | Pendiente             |

Capturas sugeridas: exportar a PDF (con el PDF resultante), añadir una lista de YouTube, buscar documentos en una web, temas de UNIR y cuadro de cuentas.

## Prácticas de privacidad

### Propósito único

```text
Ampliar Gemini Notebook (NotebookLM): exportar sus conversaciones a PDF y añadirle fuentes (vídeos de YouTube, documentos de webs y temas de UNIR) desde la página en la que está el usuario.
```

### Justificación de los permisos

| Permiso                                | Justificación                                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                              | Guardar las preferencias (incluir preguntas en el PDF, última cuenta y último cuaderno usados) y pasar la conversación a la página de impresión.                        |
| `activeTab`                            | Leer la URL de la pestaña activa al abrir el panel, para ofrecer la acción adecuada a la página (cuaderno, YouTube, web o UNIR).                                        |
| `scripting`                            | Buscar los enlaces a documentos PDF, Word y PowerPoint en la página activa y, en el visor de UNIR, pedir la lista de temas desde la propia pestaña.                     |
| Hosts de Gemini Notebook               | Leer la conversación para el PDF, listar los cuadernos del usuario y añadirles fuentes con su sesión.                                                                   |
| Hosts de YouTube                       | Leer el título y los vídeos de una lista de reproducción para añadirlos como fuentes.                                                                                   |
| `http://*/*`, `https://*/*` (opcional) | Consultar el tamaño de los documentos enlazados en cualquier web y descargarlos para subirlos al cuaderno. Se pide solo la primera vez que el usuario busca documentos. |

**¿Usas código remoto?** No. Todo el código, incluido KaTeX, va en el paquete.

### Uso de datos

Marcar:

- **Información personal identificable:** el correo de las cuentas de Google, para elegir la cuenta. Solo se muestra en el panel.
- **Información de autenticación:** las cookies de la sesión de Google (las usa el navegador al llamar a Gemini Notebook y YouTube) y el token del campus de UNIR, que no sale de la pestaña del visor.
- **Contenido del sitio web:** la conversación del cuaderno (para el PDF) y los documentos que el usuario sube.

Certificar las tres declaraciones: no se venden ni se transfieren datos a terceros, no se usan para fines ajenos al propósito único y no se usan para determinar solvencia ni conceder préstamos.

**URL de la política de privacidad:** https://github.com/adriandizdev/tools-for-gemini-notebook/blob/main/PRIVACY.md

## Antes de cada envío

1. Subir la versión en `package.json` y fechar la entrada en `CHANGELOG.md`.
2. `npm run zip` y subir `.output/tools-for-gemini-notebook-<versión>-chrome.zip`.
