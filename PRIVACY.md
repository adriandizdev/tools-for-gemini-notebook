# Política de privacidad

NotebookLM Tools no tiene servidor propio y **no envía datos a terceros**. Todo ocurre en tu navegador, entre tú y los servicios que ya usas.

## Qué datos toca

| Dato                           | Para qué                                        | Dónde va                                                                              |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| Conversación de NotebookLM     | Generar el PDF                                  | Se guarda un momento en `storage.session` y se borra al abrir la página de impresión. |
| Cookies de tu sesión de Google | Listar tus cuadernos y añadirles fuentes        | Solo a NotebookLM y YouTube, igual que al usarlos directamente.                       |
| Token del campus de UNIR       | Pedir la lista de temas y su enlace de descarga | Solo se usa dentro de la pestaña del visor. Nunca sale de ella ni se guarda.          |
| Documentos de una web          | Subirlos como fuente                            | Se descargan **sin cookies** y se suben a tu cuaderno de NotebookLM.                  |

## Qué se guarda

En `storage.local`, solo dos preferencias:

- `export-options`: si incluir tus preguntas en el PDF.
- `last-notebook`: el último cuaderno usado, para preseleccionarlo.

No hay analítica, telemetría ni publicidad.

## Permisos

- `storage`, `activeTab` y `scripting`: guardar las preferencias, leer la página activa al abrir el panel y buscar documentos en ella.
- Acceso a NotebookLM y YouTube: llamar a sus servicios con tu sesión.
- Acceso a todas las webs (**opcional**, se pide al usarlo): consultar el tamaño de los documentos y descargarlos.

## Contacto

adriandizdev@gmail.com
