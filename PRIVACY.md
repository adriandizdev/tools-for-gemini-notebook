# Política de privacidad

NotebookLM Tools no tiene servidor propio y **no envía datos a terceros**. Todo ocurre en tu navegador, entre tú y los servicios que ya usas.

## Qué datos toca

| Dato                            | Para qué                                           | Dónde va                                                                              |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Conversación de NotebookLM      | Generar el PDF                                     | Se guarda un momento en `storage.session` y se borra al abrir la página de impresión. |
| Cookies de tu sesión de Google  | Listar tus cuadernos y añadirles fuentes           | Solo a NotebookLM y YouTube, igual que al usarlos directamente.                       |
| Correo de tus cuentas de Google | Elegir con qué cuenta importar (cuadro de cuentas) | Se lee de NotebookLM y solo se muestra en el panel. No se envía a ningún sitio.       |
| Token del campus de UNIR        | Pedir la lista de temas y su enlace de descarga    | Solo se usa dentro de la pestaña del visor. Nunca sale de ella ni se guarda.          |
| Documentos de una web           | Subirlos como fuente                               | Se descargan **sin cookies** y se suben a tu cuaderno de NotebookLM.                  |

## Qué se guarda

En el almacenamiento de la extensión en tu navegador, solo estas preferencias:

- `export-options`: si incluir tus preguntas en el PDF.
- `last-account`: el correo de la última cuenta usada, para volver a elegirla y avisarte si ya no tiene la sesión iniciada. En incógnito se guarda aparte (`last-account-incognito`, en `storage.session`) y se olvida al cerrar las ventanas de incógnito.
- `last-notebooks`: el último cuaderno usado en cada cuenta, para preseleccionarlo.

No hay analítica, telemetría ni publicidad.

## Permisos

- `storage`, `activeTab` y `scripting`: guardar las preferencias, leer la página activa al abrir el panel y buscar documentos en ella.
- Acceso a NotebookLM y YouTube: llamar a sus servicios con tu sesión.
- Acceso a todas las webs (**opcional**, se pide al usarlo): consultar el tamaño de los documentos y descargarlos.

## Contacto

adriandizdev@gmail.com
