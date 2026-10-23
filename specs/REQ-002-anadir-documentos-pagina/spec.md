# spec.md: REQ-002 - Añadir como fuente los documentos de una página web

| Campo | Valor |
|---|---|
| **ID** | REQ-002 |
| **Estado** | Cerrado |
| **Versión** | 1.5 |
| **Fecha** | 2026-10-23 |
| **Depende de** | REQ-001 |

## 1. Contexto

Mientras navega por cualquier web, el usuario de la extensión puede ver los documentos PDF, Word y PowerPoint que contiene la página y añadirlos como fuentes del cuaderno que elija, uno a uno o varios a la vez, con el nombre que prefiera. Así evita tener que descargar cada documento y subirlo a NotebookLM a mano.

- **Comportamiento actual**: en una web que no es YouTube ni NotebookLM, el panel muestra el mensaje M-10 ("No hay acciones disponibles en esta página"). Para añadir un documento de una web como fuente, el usuario lo descarga, abre NotebookLM, entra en el cuaderno y lo sube.
- **Relación con REQ-001**: este requisito reutiliza la elección del cuaderno destino de REQ-001 y los mensajes M-09 y M-10. Modifica dos puntos de REQ-001: RF-13, porque M-10 pasa a mostrarse solo en las páginas sin documentos, y la exclusión "Importar como fuente contenido de webs distintas de YouTube" de su sección *Fuera de Alcance*.
- **Relación con REQ-003**: en el visor de contenidos de UNIR, el listado de temas de REQ-003 sustituye a la búsqueda de documentos de este requisito. REQ-003 reutiliza el permiso de acceso a las webs, las reglas de añadir y los mensajes M-09 a M-19.
- **Relación con REQ-004**: la lista de cuadernos es la de la cuenta activa elegida según REQ-004, el último cuaderno usado se recuerda por cuenta y el mensaje de sesión no iniciada es M-19, que sustituye a M-08.
- **Medida de éxito**: un documento enlazado en una web pública se añade al cuaderno elegido con el nombre editado, y cada caso de error muestra su mensaje sin dejar fuentes a medias.

## 3. Requisitos Funcionales (Sintaxis EARS)

- **RF-01** (Complejo): Mientras la pestaña activa muestre una web distinta de NotebookLM y YouTube, cuando el usuario abra el panel de la extensión, el sistema debe buscar los documentos de la página.
- **RF-02** (Ubicuo): El sistema debe incluir en el listado los documentos enlazados desde la página.
- **RF-03** (Ubicuo): El sistema debe incluir en el listado los PDF incrustados en la página.
- **RF-04** (Estado): Mientras la pestaña activa muestre un PDF abierto directamente en el navegador, el sistema debe incluir ese PDF en el listado.
- **RF-05** (Evento): Cuando el sistema encuentra un documento, el sistema debe mostrarlo en el listado sin esperar a que termine la búsqueda.
- **RF-06** (Estado): Mientras la búsqueda de documentos no haya terminado, el sistema debe mostrar el mensaje M-11.
- **RF-07** (Ubicuo): El sistema debe proponer como nombre de cada documento del listado su nombre de fichero, limpiado según RN-06.
- **RF-08** (Ubicuo): El sistema debe permitir editar el nombre de cada documento del listado antes de añadirlo.
- **RF-09** (Ubicuo): El sistema debe ofrecer una acción "Añadir" junto a cada documento del listado.
- **RF-10** (Ubicuo): El sistema debe permitir seleccionar varios documentos del listado.
- **RF-11** (Estado): Mientras haya al menos un documento seleccionado, el sistema debe ofrecer la acción "Añadir seleccionados".
- ~~**RF-12** (Ubicuo): El sistema debe permitir elegir el cuaderno destino entre los cuadernos existentes del usuario, con las mismas reglas de REQ-001: lista actualizada (RF-09), último cuaderno usado preseleccionado (RF-04, RN-10) y sin preselección si ese cuaderno ya no existe (CB-05).~~ *(Retirado en v1.4 → RF-23)*
- **RF-13** (Evento): Cuando el usuario elige "Añadir" en un documento, el sistema debe añadir ese documento al cuaderno destino.
- **RF-14** (Evento): Cuando el usuario elige "Añadir seleccionados", el sistema debe añadir los documentos seleccionados al cuaderno destino.
- **RF-15** (Ubicuo): El sistema debe dar a cada fuente nueva el nombre que figura en el listado en el momento de añadirla.
- **RF-16** (Ubicuo): El sistema debe mostrar junto a cada documento del listado su estado: pendiente, añadiendo, añadido, ya en el cuaderno o no añadido con su motivo.
- **RF-17** (Evento): Cuando un único documento se añade correctamente, el sistema debe mostrar el mensaje M-12.
- **RF-18** (Evento): Cuando "Añadir seleccionados" termina con todos los documentos añadidos, el sistema debe mostrar el mensaje M-13.
- **RF-19** (Evento): Cuando "Añadir seleccionados" termina con algún documento ya presente o no añadido, el sistema debe mostrar el mensaje M-14.
- **RF-20** (Estado): Mientras la pestaña activa muestre NotebookLM, YouTube o el visor de contenidos de UNIR, el sistema debe ocultar el listado de documentos.
- **RF-21** (Estado): Mientras el usuario no haya dado permiso a la extensión para acceder a las webs, el sistema debe ofrecer en el panel la acción "Permitir buscar documentos" en lugar del listado.
- **RF-22** (Evento): Cuando el usuario concede el permiso para acceder a las webs, el sistema debe buscar los documentos de la página.
- **RF-23** (Ubicuo): El sistema debe permitir elegir el cuaderno destino entre los cuadernos de la cuenta activa, con las reglas de REQ-001 y REQ-004: lista actualizada (REQ-001 RF-18), último cuaderno usado de la cuenta activa preseleccionado (REQ-004 RF-12, REQ-001 RN-10) y sin preselección si ese cuaderno ya no existe (REQ-001 CB-05).

## 4. Reglas de Negocio

- **RN-01**: Se consideran documentos los ficheros PDF, Word (formato actual, `.docx`) y PowerPoint (formato actual, `.pptx`). Los formatos antiguos de Word (`.doc`) y PowerPoint (`.ppt`) no se buscan, porque Gemini Notebook no los admite.
- **RN-02**: Dos documentos con la misma dirección son el mismo documento.
- **RN-03**: Dos documentos con dirección distinta son el mismo documento si tienen el mismo nombre de fichero y el mismo tamaño.
- **RN-04**: Si no se conoce el tamaño de un documento, se considera distinto de cualquier otro con dirección distinta.
- **RN-05**: Cada documento aparece una sola vez en el listado. Si al conocer los tamaños resulta que dos documentos ya mostrados son el mismo, el listado deja solo uno.
- **RN-06**: El nombre propuesto se obtiene del nombre del fichero de esta forma:
  - Se quita la extensión.
  - Los caracteres codificados de la dirección se muestran como el carácter original (por ejemplo, `%20` como espacio).
  - `_`, `-`, `.` y `+` se cambian por espacios.
  - Se quitan los demás símbolos y se conservan las letras, incluidas las acentuadas y la ñ, y los números.
  - Los espacios repetidos se reducen a uno y se quitan los del principio y el final.

  Ejemplo: `Informe_anual-2025%20(v2).pdf` → "Informe anual 2025 v2".
- **RN-07**: Si el usuario deja vacío el nombre de un documento, se usa el nombre propuesto.
- **RN-08**: Una selección se añade completa o no se añade. Nunca se añade solo una parte por falta de espacio en el cuaderno.
- **RN-09**: En una selección, los documentos que no se pueden añadir se omiten y los demás se añaden. RN-08 solo aplica a la falta de espacio.
- **RN-10**: Un documento que ya es fuente del cuaderno destino no se vuelve a añadir y se avisa al usuario.
- **RN-11**: Cada documento se añade como una fuente independiente.
- **RN-12**: No hay un número máximo de documentos por página.
- **RN-13**: Los mensajes al usuario son los de la tabla de la sección 6.1.
- **RN-14**: De los documentos incrustados en la página solo se buscan los PDF. Los Word y PowerPoint se buscan solo como enlaces.
- **RN-15**: Un documento ya es fuente del cuaderno destino si el cuaderno tiene una fuente con el mismo nombre que figura en el listado.
- **RN-16**: Si el usuario cierra el panel, la búsqueda se descarta y los documentos que ya se estaban añadiendo se terminan de añadir.

## 6. Casos Borde y Comportamientos de Error

- **CB-01** (No deseado): Si los documentos seleccionados superan las fuentes que aún admite el cuaderno destino, entonces el sistema debe mostrar el mensaje M-16 sin añadir ningún documento.
- **CB-02** (No deseado): Si un documento ya es fuente del cuaderno destino, entonces el sistema debe mostrar el mensaje M-15 en el estado de ese documento.
- **CB-03** (No deseado): Si no se puede acceder a un documento (exige iniciar sesión en esa web, no existe o la web lo deniega), entonces el sistema debe mostrar en su estado el mensaje M-17 con el motivo.
- **CB-04** (No deseado): Si NotebookLM rechaza un documento, entonces el sistema debe mostrar en su estado el mensaje M-17 con el motivo.
- **CB-05** (No deseado): Si no se puede añadir ninguno de los documentos seleccionados, entonces el sistema debe mostrar el mensaje M-18 con el motivo.
- ~~**CB-06** (No deseado): Si el usuario no ha iniciado sesión en NotebookLM, entonces el sistema debe mostrar el mensaje M-08.~~ *(Retirado en v1.4 → CB-10)*
- **CB-07** (No deseado): Si el usuario no tiene ningún cuaderno, entonces el sistema debe mostrar el mensaje M-09.
- **CB-08** (No deseado): Si la búsqueda termina sin encontrar ningún documento, entonces el sistema debe mostrar el mensaje M-10.
- **CB-09** (No deseado): Si el usuario deniega el permiso para acceder a las webs, entonces el sistema debe seguir ofreciendo la acción "Permitir buscar documentos".
- **CB-10** (No deseado): Si no hay ninguna cuenta con la sesión iniciada en Gemini Notebook según REQ-004 (RN-01), entonces el sistema debe mostrar el mensaje M-19.

### 6.1 Mensajes al usuario

Textos aprobados por el usuario. Lo que va entre llaves se sustituye por el dato real. M-09 y M-10 son los de REQ-001 y M-19 el de REQ-004, sin cambios.

| ID | Situación | Texto |
|---|---|---|
| ~~M-08~~ | ~~Sin sesión (CB-06)~~ | ~~Para añadir fuentes debe iniciar sesión.~~ *(Retirado en v1.4 → M-19)* |
| M-09 | Sin cuadernos (CB-07) | No tiene ningún cuaderno. Cree uno en Gemini Notebook antes de añadir fuentes. |
| M-10 | Página sin documentos (CB-08) | No hay acciones disponibles en esta página. |
| M-11 | Búsqueda en curso (RF-06) | Buscando documentos en la página… |
| M-12 | Un documento añadido (RF-17) | Documento añadido a «{cuaderno}». |
| M-13 | Selección añadida completa (RF-18) | Se han añadido {n} documentos a «{cuaderno}». |
| M-14 | Selección con omisiones (RF-19) | Se han añadido {n} de {total} documentos a «{cuaderno}». {k} ya estaban en el cuaderno y {m} no se han podido añadir. |
| M-15 | Documento ya presente (CB-02) | Este documento ya está en «{cuaderno}». No se ha añadido de nuevo. |
| M-16 | La selección no cabe (CB-01) | Ha seleccionado {n} documentos nuevos, pero «{cuaderno}» solo admite {m} fuentes más. Seleccione menos documentos. |
| M-17 | Documento no añadido (CB-03, CB-04) | No se ha podido añadir el documento: {motivo}. |
| M-18 | Ningún documento añadido (CB-05) | No se ha añadido ningún documento: {motivo}. |
| M-19 | Sin sesión (CB-10) | Para importar contenido debe iniciar sesión en Gemini Notebook. |

## 7. Requisitos No Funcionales

- **RNF-01** (Rendimiento percibido): Los documentos de la página empiezan a aparecer en el listado en menos de 2 segundos desde que se abre el panel. La comprobación de tamaños de RN-03 puede terminar después.
- **RNF-02** (Rendimiento percibido): Para distinguir documentos, el sistema no descarga el contenido de ninguno.

## 8. Fuera de Alcance

- Añadir documentos que solo son accesibles con una sesión iniciada en la web que los publica, como intranets o campus virtuales; en esta iteración se aplica CB-03. Los temas del visor de contenidos de UNIR se añaden según REQ-003.
- Otros formatos: Excel, texto, imágenes.
- Documentos que la web carga después de terminar la búsqueda, por ejemplo al desplazarse por la página.
- Buscar documentos en varias pestañas a la vez.
- Botón para añadir documentos dentro de la propia web.
- Crear un cuaderno nuevo desde la extensión.

## 9. Criterios de Aceptación

- **CA-01** → RF-01, RF-02, RF-05, RF-06, RF-07, RN-01, RNF-01
  - **Dado** una web pública que enlaza un PDF, un Word y un PowerPoint
  - **Cuando** el usuario abre el panel de la extensión en esa web
  - **Entonces** el mensaje M-11 aparece mientras dura la búsqueda, los tres documentos empiezan a aparecer en menos de 2 segundos, cada uno con su nombre de fichero limpio como nombre propuesto, y M-11 desaparece al terminar la búsqueda
- **CA-02** → RF-03
  - **Dado** una web que muestra un PDF incrustado en la página
  - **Cuando** el usuario abre el panel
  - **Entonces** ese PDF aparece en el listado
- **CA-03** → RF-04
  - **Dado** que la pestaña activa muestra un PDF abierto directamente en el navegador
  - **Cuando** el usuario abre el panel
  - **Entonces** ese PDF aparece en el listado
- **CA-04** → RF-09, RF-23, RF-13, RF-15, RF-16, RF-17, RN-11
  - **Dado** que el usuario tiene al menos un cuaderno y el listado muestra un PDF
  - **Cuando** elige el cuaderno destino y pulsa "Añadir" en ese PDF
  - **Entonces** el estado del PDF pasa a "añadiendo" y después a "añadido", aparece el mensaje M-12 y el PDF figura en ese cuaderno como una fuente con el nombre del listado
- **CA-05** → RF-08, RF-15
  - **Dado** un documento con nombre propuesto "Informe anual 2025"
  - **Cuando** el usuario cambia el nombre a "Memoria 2025" y lo añade a un cuaderno
  - **Entonces** la fuente nueva se llama "Memoria 2025"
- **CA-06** → RN-07
  - **Dado** un documento con nombre propuesto "Informe anual 2025"
  - **Cuando** el usuario borra el nombre por completo y lo añade a un cuaderno
  - **Entonces** la fuente nueva se llama "Informe anual 2025"
- **CA-07** → RN-06
  - **Dado** un enlace a `Informe_anual-2025%20(v2).pdf`
  - **Cuando** el usuario abre el panel
  - **Entonces** el nombre propuesto es "Informe anual 2025 v2"
- **CA-08** → RF-10, RF-11, RF-14, RF-18
  - **Dado** un listado con 5 documentos, ninguno en el cuaderno destino, que admite al menos 3 fuentes más
  - **Cuando** el usuario selecciona 3 documentos y pulsa "Añadir seleccionados"
  - **Entonces** se añaden solo esos 3, cada uno muestra el estado "añadido" y aparece el mensaje M-13 indicando 3 documentos
- **CA-09** → RF-11
  - **Dado** un listado sin ningún documento seleccionado
  - **Cuando** el usuario mira el panel
  - **Entonces** la acción "Añadir seleccionados" no está disponible
- **CA-10** → RN-08, CB-01
  - **Dado** un cuaderno que solo admite 2 fuentes más
  - **Cuando** el usuario selecciona 3 documentos nuevos y pulsa "Añadir seleccionados"
  - **Entonces** aparece el mensaje M-16 y el cuaderno no tiene ninguna fuente nueva
- **CA-11** → RN-09, RF-16, RF-19, CB-03
  - **Dado** una selección de 3 documentos, uno de los cuales no existe en la web que lo enlaza, y un cuaderno con espacio para los 3
  - **Cuando** el usuario pulsa "Añadir seleccionados"
  - **Entonces** se añaden los otros 2, el documento inexistente muestra en su estado el mensaje M-17 con el motivo y aparece el mensaje M-14 indicando 2 añadidos y 1 no añadido
- **CA-12** → CB-03
  - **Dado** un enlace a un documento que exige iniciar sesión en la web que lo publica
  - **Cuando** el usuario pulsa "Añadir" en ese documento
  - **Entonces** su estado muestra el mensaje M-17 con el motivo y el cuaderno no tiene ninguna fuente nueva
- **CA-13** → CB-04
  - **Dado** un documento que NotebookLM no admite como fuente
  - **Cuando** el usuario intenta añadirlo
  - **Entonces** su estado muestra el mensaje M-17 con el motivo de NotebookLM y el cuaderno no tiene ninguna fuente nueva
- **CA-14** → CB-05
  - **Dado** una selección de 2 documentos, ninguno de los cuales se puede añadir
  - **Cuando** el usuario pulsa "Añadir seleccionados"
  - **Entonces** aparece el mensaje M-18 con el motivo y el cuaderno no tiene ninguna fuente nueva
- **CA-15** → RN-10, CB-02, RF-19
  - **Dado** un cuaderno que ya tiene como fuente uno de los 3 documentos seleccionados
  - **Cuando** el usuario los añade a ese cuaderno
  - **Entonces** se añaden solo los 2 que faltan, el documento repetido muestra el mensaje M-15 en su estado y aparece el mensaje M-14 indicando 2 añadidos y 1 ya presente
- **CA-16** → RN-02, RN-05
  - **Dado** una web que enlaza dos veces el mismo PDF y además lo muestra incrustado, siempre con la misma dirección
  - **Cuando** el usuario abre el panel
  - **Entonces** el PDF aparece una sola vez en el listado
- **CA-17** → RN-03, RN-05, RNF-02
  - **Dado** dos enlaces con direcciones distintas a sendos `informe.pdf` del mismo tamaño
  - **Cuando** el usuario abre el panel
  - **Entonces** el listado muestra un solo documento y no se ha descargado el contenido de ninguno de los dos
- **CA-18** → RN-03
  - **Dado** dos enlaces con direcciones distintas a sendos `informe.pdf` de distinto tamaño
  - **Cuando** el usuario abre el panel
  - **Entonces** el listado muestra los dos documentos
- **CA-19** → RN-04
  - **Dado** dos enlaces con direcciones distintas a sendos `informe.pdf` cuyo tamaño no informa la web
  - **Cuando** el usuario abre el panel
  - **Entonces** el listado muestra los dos documentos
- **CA-20** → RN-12, RF-05
  - **Dado** una web que enlaza 300 documentos
  - **Cuando** el usuario abre el panel
  - **Entonces** los documentos van apareciendo mientras se muestra M-11, y al terminar la búsqueda el listado contiene los 300
- **CA-21** → CB-08
  - **Dado** una web sin documentos enlazados ni incrustados
  - **Cuando** el usuario abre el panel y termina la búsqueda
  - **Entonces** aparece el mensaje M-10
- **CA-22** → RF-20
  - **Dado** dos pestañas: un vídeo de YouTube y una conversación de NotebookLM, ambas con enlaces a documentos PDF
  - **Cuando** el usuario abre el panel en cada una
  - **Entonces** en ninguna aparece el listado de documentos
- **CA-23** → CB-10
  - **Dado** que no hay ninguna cuenta con la sesión iniciada en Gemini Notebook y la pestaña activa muestra una web con documentos
  - **Cuando** el usuario abre el panel
  - **Entonces** aparece el mensaje M-19
- **CA-24** → CB-07
  - **Dado** que el usuario ha iniciado sesión y no tiene ningún cuaderno
  - **Cuando** intenta añadir un documento del listado
  - **Entonces** aparece el mensaje M-09
- **CA-25** → RF-23
  - **Dado** que el último cuaderno al que el usuario añadió una fuente desde la cuenta activa es "Física"
  - **Cuando** va a añadir un documento del listado
  - **Entonces** "Física" aparece preseleccionado como cuaderno destino
- **CA-26** → RN-13
  - **Dado** cada situación de la tabla 6.1
  - **Cuando** se produce durante las pruebas de CA-01 a CA-25 y CA-27 a CA-32
  - **Entonces** el texto mostrado coincide con el de la tabla
- **CA-27** → RN-14
  - **Dado** una web que muestra incrustados un PDF y un PowerPoint, sin enlaces a ellos
  - **Cuando** el usuario abre el panel
  - **Entonces** el listado muestra solo el PDF
- **CA-28** → RN-15
  - **Dado** un cuaderno con una fuente llamada "Memoria 2025"
  - **Cuando** el usuario añade a ese cuaderno un documento cuyo nombre en el listado es "Memoria 2025"
  - **Entonces** el documento muestra el mensaje M-15 en su estado y el cuaderno conserva una única fuente con ese nombre
- **CA-29** → RN-16
  - **Dado** que el usuario ha pulsado "Añadir seleccionados" con 3 documentos
  - **Cuando** cierra el panel antes de que termine
  - **Entonces** los 3 documentos acaban como fuentes del cuaderno
- **CA-30** → RF-21, RF-22, CB-09
  - **Dado** que el usuario no ha dado permiso a la extensión para acceder a las webs
  - **Cuando** abre el panel en una web con documentos, pulsa "Permitir buscar documentos" y primero deniega el permiso y después lo concede
  - **Entonces** tras denegarlo sigue viendo "Permitir buscar documentos", y tras concederlo aparece el listado de documentos
- **CA-31** → RN-01
  - **Dado** una web que enlaza `informe.docx`, `informe.doc`, `clase.pptx` y `clase.ppt`
  - **Cuando** el usuario abre el panel
  - **Entonces** el listado muestra solo `informe.docx` y `clase.pptx`
- **CA-32** → RF-20
  - **Dado** la página de un tema del visor de contenidos de UNIR que contiene enlaces a otras webs
  - **Cuando** el usuario abre el panel
  - **Entonces** no aparece el listado de documentos de la página, sino el listado de temas de REQ-003

## 10. Supuestos y Preguntas Abiertas

**Supuestos** (SUP-02 a SUP-07 confirmados por el usuario en v1.5)
- ~~**SUP-01**: Gemini Notebook admite PDF, Word y PowerPoint como fuente. Si rechaza alguno de estos formatos, se aplica CB-04.~~ *(Confirmado en v1.2 solo para los formatos actuales → RN-01)*
- **SUP-02**: El cuaderno destino se elige una sola vez en el panel y se aplica tanto a "Añadir" como a "Añadir seleccionados".
- **SUP-03**: Para el límite de CB-01 solo cuentan los documentos seleccionados que todavía no están en el cuaderno, como en REQ-001 (RN-12).
- **SUP-04**: Saber si un documento ya es fuente del cuaderno depende de lo que permita Gemini Notebook, como en REQ-001 (RN-07). Si no lo permite, los documentos se añaden sin esa comprobación y RN-10, CB-02 y el recuento de "ya estaban" de M-14 no se aplican.
- **SUP-05**: El panel se amplía para que el nombre editable y el estado de cada documento se lean sin cortes.
- **SUP-06**: Al abrir el panel, ningún documento del listado está seleccionado.
- **SUP-07**: La búsqueda se hace sobre la página tal como está al abrir el panel.

**Preguntas abiertas**
- ~~**PA-01**: ¿Se buscan también los Word y PowerPoint incrustados en la página, o solo los PDF incrustados?~~ *(Resuelta en v1.1 → RN-14)*
- ~~**PA-02**: ¿Cuándo se considera que un documento "ya es fuente" del cuaderno?~~ *(Resuelta en v1.1 → RN-15)*
- ~~**PA-03**: ¿Qué ocurre si el usuario cierra el panel mientras se buscan o se añaden documentos?~~ *(Resuelta en v1.1 → RN-16)*
- ~~**PA-04**: ¿Se actualiza REQ-001 para reflejar los cambios descritos en *Relación con REQ-001*?~~ *(Resuelta en v1.1: REQ-001 v1.5)*

## 11. Glosario

| Término | Definición |
|---|---|
| NotebookLM | Servicio de Google al que se dirige la extensión; ahora se llama Gemini Notebook. En esta spec, los dos nombres son equivalentes. |
| Cuaderno | Espacio de trabajo de NotebookLM que agrupa fuentes y conversaciones. |
| Fuente | Documento o contenido que se añade a un cuaderno para que NotebookLM lo use al responder. |
| Documento | Fichero PDF, Word o PowerPoint enlazado desde una página web, incrustado en ella o abierto directamente en el navegador. |
| Listado | Relación de los documentos encontrados en la página, que se muestra en el panel de la extensión. |
| Dirección | Ubicación en la web desde la que se obtiene un documento. |
| Selección | Conjunto de documentos del listado que el usuario marca para añadirlos de una vez. |

## Changelog

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-10-21 | Versión inicial. |
| 1.1 | 2026-10-21 | Se resuelven PA-01 a PA-04. Se añaden RF-21, RF-22 (permiso para acceder a las webs), RN-14 a RN-16, CB-09 y CA-27 a CA-30. CA-26 amplía su alcance a los CA nuevos. |
| 1.2 | 2026-10-21 | Verificado contra Gemini Notebook: solo admite los formatos actuales de Word y PowerPoint. RN-01 se concreta, SUP-01 queda confirmado en parte y se añade CA-31. |
| 1.3 | 2026-10-22 | Relación con REQ-003: RF-20 también oculta el listado en el visor de contenidos de UNIR, la exclusión de campus virtuales remite a REQ-003 y se añade CA-32. CA-26 amplía su alcance a CA-32. |
| 1.4 | 2026-10-23 | Por REQ-004 (elegir la cuenta de Google): se retiran RF-12 y CB-06, sustituidos por RF-23 (cuadernos de la cuenta activa, con referencias a REQ-001 v1.7) y CB-10. M-08 se retira y se sustituye por M-19. CA-04, CA-23 y CA-25 se ajustan. |
| 1.5 | 2026-10-23 | El usuario confirma SUP-02 a SUP-07. Estado: Cerrado. |
