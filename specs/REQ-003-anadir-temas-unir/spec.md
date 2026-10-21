# spec.md: REQ-003 - Añadir como fuente los temas del visor de UNIR

| Campo | Valor |
|---|---|
| **ID** | REQ-003 |
| **Estado** | Cerrado |
| **Versión** | 1.2 |
| **Fecha** | 2026-10-22 |
| **Depende de** | REQ-002 |

## 1. Contexto

Un estudiante de UNIR que consulta el material de una asignatura en el visor de contenidos del campus puede añadir el PDF de cada tema como fuente del cuaderno que elija, uno a uno o todos a la vez, sin descargarlos y subirlos a mano. En la página de la asignatura ve todos sus temas y en la página de un tema, solo ese tema.

- **Comportamiento actual**: el visor no enlaza los PDF de los temas en la página; solo los entrega tras pulsar su icono de descarga, con la sesión del campus iniciada. Por eso la búsqueda de documentos de REQ-002 no encuentra ninguno y el panel muestra M-10. Para añadir un tema como fuente, el estudiante lo descarga, abre NotebookLM, entra en el cuaderno y lo sube.
- **Relación con REQ-002**: este requisito reutiliza el permiso de acceso a las webs, la elección del cuaderno destino, las reglas de añadir (duplicados, cupo, fallos sueltos, cierre del panel) y los mensajes M-08 a M-18. En el visor de UNIR, el listado de temas sustituye a la búsqueda de documentos de REQ-002. También cubre en parte una exclusión de REQ-002 (*Fuera de Alcance*: "campus virtuales"). REQ-002 v1.3 recoge estos cambios.
- **Medida de éxito**: los temas de una asignatura del visor de UNIR quedan como fuentes del cuaderno elegido con una sola acción, cada uno con el título del tema como nombre.

## 3. Requisitos Funcionales (Sintaxis EARS)

- **RF-01** (Complejo): Mientras la pestaña activa muestre la página de una asignatura del visor de UNIR, cuando el usuario abra el panel de la extensión, el sistema debe mostrar en el listado todos los temas de la asignatura.
- **RF-02** (Complejo): Mientras la pestaña activa muestre la página de un tema del visor de UNIR, cuando el usuario abra el panel de la extensión, el sistema debe mostrar en el listado solo ese tema.
- **RF-03** (Estado): Mientras el sistema esté obteniendo los temas, el sistema debe mostrar el mensaje M-11.
- **RF-04** (Estado): Mientras la pestaña activa muestre el visor de UNIR, el sistema debe omitir la búsqueda de documentos de REQ-002.
- **RF-05** (Ubicuo): El sistema debe proponer como nombre de cada tema del listado su título tal como aparece en el visor.
- **RF-06** (Evento): Cuando el sistema muestra el listado de temas, el sistema debe mostrar todos los temas seleccionados.
- **RF-07** (Ubicuo): El sistema debe permitir seleccionar y deseleccionar cada tema del listado.
- **RF-08** (Ubicuo): El sistema debe permitir editar el nombre de cada tema del listado antes de añadirlo.
- **RF-09** (Ubicuo): El sistema debe ofrecer una acción "Añadir" junto a cada tema del listado.
- **RF-10** (Estado): Mientras haya al menos un tema seleccionado, el sistema debe ofrecer la acción "Añadir seleccionados".
- **RF-11** (Ubicuo): El sistema debe permitir elegir el cuaderno destino con las mismas reglas de REQ-002 (RF-12): cuadernos existentes del usuario, último cuaderno usado preseleccionado y sin preselección si ese cuaderno ya no existe.
- **RF-12** (Evento): Cuando el usuario elige "Añadir" en un tema, el sistema debe añadir el PDF de ese tema al cuaderno destino.
- **RF-13** (Evento): Cuando el usuario elige "Añadir seleccionados", el sistema debe añadir los PDF de los temas seleccionados al cuaderno destino.
- **RF-14** (Ubicuo): El sistema debe dar a cada fuente nueva el nombre que figura en el listado en el momento de añadirla.
- **RF-15** (Ubicuo): El sistema debe mostrar junto a cada tema del listado su estado: pendiente, añadiendo, añadido, ya en el cuaderno o no añadido con su motivo.
- **RF-16** (Evento): Cuando un único tema se añade correctamente, el sistema debe mostrar el mensaje M-12.
- **RF-17** (Evento): Cuando "Añadir seleccionados" termina con todos los temas añadidos, el sistema debe mostrar el mensaje M-13.
- **RF-18** (Evento): Cuando "Añadir seleccionados" termina con algún tema ya presente o no añadido, el sistema debe mostrar el mensaje M-14.
- **RF-19** (Estado): Mientras el usuario no haya concedido el permiso de acceso a las webs de REQ-002, el sistema debe ofrecer en el panel la acción "Permitir buscar documentos" en lugar del listado de temas.
- **RF-20** (Evento): Cuando el usuario concede el permiso de acceso a las webs desde el visor de UNIR, el sistema debe mostrar el listado de temas.

## 4. Reglas de Negocio

- **RN-01**: El PDF de un tema es el documento con el tema completo que el visor entrega con el icono de descarga de ese tema.
- **RN-02**: Cada tema se añade como una fuente independiente.
- **RN-03**: Si el usuario deja vacío el nombre de un tema, se usa el título del tema.
- **RN-04**: Un tema ya es fuente del cuaderno destino si el cuaderno tiene una fuente con el mismo nombre que figura en el listado. No se vuelve a añadir y se avisa al usuario.
- **RN-05**: Una selección se añade completa o no se añade. Nunca se añade solo una parte por falta de espacio en el cuaderno.
- **RN-06**: En una selección, los temas que no se pueden añadir se omiten y los demás se añaden. RN-05 solo aplica a la falta de espacio.
- **RN-07**: Si el usuario cierra el panel, los temas que ya se estaban añadiendo se terminan de añadir.
- **RN-08**: El permiso que necesita este requisito es el mismo de REQ-002. Si el usuario ya lo concedió para buscar documentos, el visor de UNIR funciona sin volver a pedirlo.
- **RN-09**: Los mensajes al usuario son los de la tabla de la sección 6.1.

## 6. Casos Borde y Comportamientos de Error

- **CB-01** (No deseado): Si los temas seleccionados superan las fuentes que aún admite el cuaderno destino, entonces el sistema debe mostrar el mensaje M-16 sin añadir ningún tema.
- **CB-02** (No deseado): Si un tema ya es fuente del cuaderno destino, entonces el sistema debe mostrar el mensaje M-15 en el estado de ese tema.
- **CB-03** (No deseado): Si no se puede obtener el PDF de un tema (por ejemplo, porque la sesión del campus ha caducado), entonces el sistema debe mostrar en su estado el mensaje M-17 con el motivo.
- **CB-04** (No deseado): Si NotebookLM rechaza el PDF de un tema, entonces el sistema debe mostrar en su estado el mensaje M-17 con el motivo.
- **CB-05** (No deseado): Si no se puede añadir ninguno de los temas seleccionados, entonces el sistema debe mostrar el mensaje M-18 con el motivo.
- **CB-06** (No deseado): Si el usuario no ha iniciado sesión en NotebookLM, entonces el sistema debe mostrar el mensaje M-08.
- **CB-07** (No deseado): Si el usuario no tiene ningún cuaderno, entonces el sistema debe mostrar el mensaje M-09.
- **CB-08** (No deseado): Si la asignatura no tiene ningún tema, entonces el sistema debe mostrar el mensaje M-10.
- **CB-09** (No deseado): Si el usuario deniega el permiso de acceso a las webs, entonces el sistema debe seguir ofreciendo la acción "Permitir buscar documentos".

### 6.1 Mensajes al usuario

Son los textos aprobados en REQ-002, sin cambios. Lo que va entre llaves se sustituye por el dato real.

| ID | Situación | Texto |
|---|---|---|
| M-08 | Sin sesión en NotebookLM (CB-06) | Para añadir fuentes debe iniciar sesión. |
| M-09 | Sin cuadernos (CB-07) | No tiene ningún cuaderno. Cree uno en Gemini Notebook antes de añadir fuentes. |
| M-10 | Asignatura sin temas (CB-08) | No hay acciones disponibles en esta página. |
| M-11 | Obteniendo los temas (RF-03) | Buscando documentos en la página… |
| M-12 | Un tema añadido (RF-16) | Documento añadido a «{cuaderno}». |
| M-13 | Selección añadida completa (RF-17) | Se han añadido {n} documentos a «{cuaderno}». |
| M-14 | Selección con omisiones (RF-18) | Se han añadido {n} de {total} documentos a «{cuaderno}». {k} ya estaban en el cuaderno y {m} no se han podido añadir. |
| M-15 | Tema ya presente (CB-02) | Este documento ya está en «{cuaderno}». No se ha añadido de nuevo. |
| M-16 | La selección no cabe (CB-01) | Ha seleccionado {n} documentos nuevos, pero «{cuaderno}» solo admite {m} fuentes más. Seleccione menos documentos. |
| M-17 | Tema no añadido (CB-03, CB-04) | No se ha podido añadir el documento: {motivo}. |
| M-18 | Ningún tema añadido (CB-05) | No se ha añadido ningún documento: {motivo}. |

## 8. Fuera de Alcance

- El fichero comprimido con todos los temas que ofrece "Descargar temas". Equivale a añadir todos los temas por separado.
- Los enlaces a otras webs y los vídeos del apartado "A fondo" de cada tema.
- Las demás zonas del campus de UNIR (foros, actividades) y las demás herramientas del visor (resúmenes, esquemas, chat de dudas, ejercicios prácticos).
- Los campus virtuales de otras universidades y otras webs que exigen iniciar sesión.
- Crear un cuaderno nuevo desde la extensión.
- Una acción para seleccionar o deseleccionar todos los temas de una vez.

## 9. Criterios de Aceptación

- **CA-01** → RF-01, RF-03, RF-05, RF-06
  - **Dado** la página de una asignatura del visor de UNIR con 12 temas y el permiso de acceso a las webs concedido
  - **Cuando** el usuario abre el panel de la extensión
  - **Entonces** aparece M-11 mientras se obtienen los temas y después el listado con los 12 temas, todos seleccionados, cada uno con su título del visor como nombre propuesto (por ejemplo, "Tema 1. Panorama general de la reutilización de software")
- **CA-02** → RF-02
  - **Dado** la página del Tema 3 de una asignatura del visor de UNIR
  - **Cuando** el usuario abre el panel
  - **Entonces** el listado muestra solo el Tema 3
- **CA-03** → RF-04
  - **Dado** la página de un tema del visor que contiene enlaces a otras webs y un vídeo de YouTube incrustado
  - **Cuando** el usuario abre el panel
  - **Entonces** el listado muestra solo el tema y no aparece ningún documento ni enlace de la página
- **CA-04** → RF-09, RF-11, RF-12, RF-14, RF-15, RF-16, RN-01, RN-02
  - **Dado** que el usuario tiene al menos un cuaderno y el listado muestra el Tema 1
  - **Cuando** elige el cuaderno destino y pulsa "Añadir" en el Tema 1
  - **Entonces** el estado del tema pasa a "añadiendo" y después a "añadido", aparece el mensaje M-12 y el cuaderno tiene una fuente nueva con el PDF completo del Tema 1 y el nombre del listado
- **CA-05** → RF-08, RF-14
  - **Dado** un tema con nombre propuesto "Tema 1. Panorama general de la reutilización de software"
  - **Cuando** el usuario cambia el nombre a "Reutilización - Tema 1" y lo añade a un cuaderno
  - **Entonces** la fuente nueva se llama "Reutilización - Tema 1"
- **CA-06** → RN-03
  - **Dado** un tema con nombre propuesto "Tema 2. Introducción a los patrones de diseño"
  - **Cuando** el usuario borra el nombre por completo y lo añade a un cuaderno
  - **Entonces** la fuente nueva se llama "Tema 2. Introducción a los patrones de diseño"
- **CA-07** → RF-07, RF-10, RF-13, RF-17
  - **Dado** el listado de una asignatura con 12 temas, ninguno en el cuaderno destino, que admite al menos 12 fuentes más
  - **Cuando** el usuario deselecciona 2 temas y pulsa "Añadir seleccionados"
  - **Entonces** se añaden solo los 10 temas seleccionados, cada uno muestra el estado "añadido" y aparece el mensaje M-13 indicando 10 documentos
- **CA-08** → RF-10
  - **Dado** un listado en el que el usuario ha deseleccionado todos los temas
  - **Cuando** el usuario mira el panel
  - **Entonces** la acción "Añadir seleccionados" no está disponible
- **CA-09** → RN-05, CB-01
  - **Dado** un cuaderno que solo admite 5 fuentes más y un listado con 12 temas seleccionados
  - **Cuando** el usuario pulsa "Añadir seleccionados"
  - **Entonces** aparece el mensaje M-16 y el cuaderno no tiene ninguna fuente nueva
- **CA-10** → RN-04, CB-02, RF-18
  - **Dado** un cuaderno que ya tiene una fuente llamada "Tema 1. Panorama general de la reutilización de software" y una selección con los temas 1, 2 y 3
  - **Cuando** el usuario los añade a ese cuaderno
  - **Entonces** se añaden solo los temas 2 y 3, el Tema 1 muestra el mensaje M-15 en su estado y aparece el mensaje M-14 indicando 2 añadidos y 1 ya presente
- **CA-11** → RN-06, CB-03, RF-18
  - **Dado** una selección de 3 temas, uno de los cuales el visor no entrega, y un cuaderno con espacio para los 3
  - **Cuando** el usuario pulsa "Añadir seleccionados"
  - **Entonces** se añaden los otros 2, el tema no entregado muestra en su estado el mensaje M-17 con el motivo y aparece el mensaje M-14 indicando 2 añadidos y 1 no añadido
- **CA-12** → CB-04
  - **Dado** un tema cuyo PDF NotebookLM no admite como fuente
  - **Cuando** el usuario intenta añadirlo
  - **Entonces** su estado muestra el mensaje M-17 con el motivo de NotebookLM y el cuaderno no tiene ninguna fuente nueva
- **CA-13** → CB-05
  - **Dado** una selección de 2 temas, ninguno de los cuales se puede añadir
  - **Cuando** el usuario pulsa "Añadir seleccionados"
  - **Entonces** aparece el mensaje M-18 con el motivo y el cuaderno no tiene ninguna fuente nueva
- **CA-14** → CB-06
  - **Dado** que el usuario no ha iniciado sesión en NotebookLM y el listado muestra un tema
  - **Cuando** intenta añadirlo
  - **Entonces** aparece el mensaje M-08
- **CA-15** → CB-07
  - **Dado** que el usuario ha iniciado sesión en NotebookLM y no tiene ningún cuaderno
  - **Cuando** intenta añadir un tema del listado
  - **Entonces** aparece el mensaje M-09
- **CA-16** → CB-08
  - **Dado** la página de una asignatura del visor sin ningún tema
  - **Cuando** el usuario abre el panel
  - **Entonces** aparece el mensaje M-10
- **CA-17** → RN-07
  - **Dado** que el usuario ha pulsado "Añadir seleccionados" con 3 temas
  - **Cuando** cierra el panel antes de que termine
  - **Entonces** los 3 temas acaban como fuentes del cuaderno
- **CA-18** → RF-19, RF-20, CB-09
  - **Dado** que el usuario no ha concedido el permiso de acceso a las webs
  - **Cuando** abre el panel en la página de una asignatura del visor, pulsa "Permitir buscar documentos" y primero deniega el permiso y después lo concede
  - **Entonces** tras denegarlo sigue viendo "Permitir buscar documentos", y tras concederlo aparece el listado de temas
- **CA-19** → RN-08
  - **Dado** que el usuario concedió el permiso de acceso a las webs al buscar documentos en otra web
  - **Cuando** abre el panel en la página de una asignatura del visor de UNIR
  - **Entonces** aparece directamente el listado de temas, sin la acción "Permitir buscar documentos"
- **CA-20** → RF-11
  - **Dado** que el último cuaderno al que el usuario añadió una fuente desde la extensión es "Reutilización"
  - **Cuando** va a añadir un tema del listado
  - **Entonces** "Reutilización" aparece preseleccionado como cuaderno destino
- **CA-21** → RN-09
  - **Dado** cada situación de la tabla 6.1
  - **Cuando** se produce durante las pruebas de CA-01 a CA-20
  - **Entonces** el texto mostrado coincide con el de la tabla

## 10. Supuestos y Preguntas Abiertas

**Supuestos** (confirmados por el usuario en v1.2)
- **SUP-01**: Los mensajes de REQ-002 se reutilizan sin cambios aunque hablen de "documentos". Para el estudiante, el PDF de un tema es un documento.
- **SUP-02**: En las demás páginas del visor de UNIR (por ejemplo, la de ejercicios prácticos), el panel muestra M-10.
- **SUP-03**: El listado muestra los temas en el mismo orden que el visor.
- **SUP-04**: Para el límite de CB-01 solo cuentan los temas seleccionados que todavía no están en el cuaderno, como en REQ-002 (SUP-03).
- **SUP-05**: El cuaderno destino se elige una sola vez en el panel y se aplica tanto a "Añadir" como a "Añadir seleccionados".
- **SUP-06**: El listado de temas aparece en menos de 2 segundos desde que se abre el panel, como en REQ-002 (RNF-01).
- **SUP-07**: La sesión del campus solo se usa para obtener los PDF de los temas. La extensión no la guarda ni la envía a ningún servicio que no sea de UNIR.
- **SUP-08**: Si el visor no entrega la lista de temas de la asignatura, el panel muestra M-10, como en CB-08.
- **SUP-09**: El visor muestra los PDF de los temas en el idioma de la asignatura, y se añaden en ese idioma.

**Preguntas abiertas**
- ~~**PA-01**: ¿Se actualiza REQ-002 para reflejar lo descrito en *Relación con REQ-002*?~~ *(Resuelta en v1.1: REQ-002 v1.3)*
- ~~**PA-02**: ¿Se añade una acción para seleccionar o deseleccionar todos los temas de una vez?~~ *(Resuelta en v1.1: no se añade; basta con que todos aparezcan seleccionados, RF-06)*

## 11. Glosario

| Término | Definición |
|---|---|
| NotebookLM | Servicio de Google al que se dirige la extensión; ahora se llama Gemini Notebook. En esta spec, los dos nombres son equivalentes. |
| Cuaderno | Espacio de trabajo de NotebookLM que agrupa fuentes y conversaciones. |
| Fuente | Documento o contenido que se añade a un cuaderno para que NotebookLM lo use al responder. |
| Visor de UNIR | Visor de contenidos del campus de UNIR donde el estudiante consulta el material de sus asignaturas. |
| Asignatura | Materia del visor de UNIR. Su página muestra el temario completo. |
| Tema | Unidad del temario de una asignatura. Tiene su propia página en el visor y un PDF con su contenido completo. |
| Listado | Relación de los temas que el panel de la extensión ofrece para añadir. |
| Selección | Conjunto de temas del listado que el usuario marca para añadirlos de una vez. |

## Changelog

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-10-22 | Versión inicial. |
| 1.1 | 2026-10-22 | Se resuelven PA-01 (REQ-002 actualizado a v1.3) y PA-02 (sin acción de seleccionar todos, que pasa a *Fuera de Alcance*). |
| 1.2 | 2026-10-22 | El usuario confirma SUP-01 a SUP-09. Estado: Cerrado. |
