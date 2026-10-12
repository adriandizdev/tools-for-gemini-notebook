# spec.md: REQ-001 - Extensión para NotebookLM: añadir vídeos de YouTube como fuente

| Campo | Valor |
|---|---|
| **ID** | REQ-001 |
| **Estado** | Cerrado |
| **Versión** | 1.4 |
| **Fecha** | 2026-10-12 |
| **Depende de** | Ninguno |

## 1. Contexto

El producto deja de ser solo un exportador de conversaciones de NotebookLM y pasa a ser una única extensión que amplía NotebookLM en general. La primera funcionalidad nueva permite importar fuentes mientras el usuario navega. En concreto, mientras ve YouTube, puede añadir el vídeo o la lista de reproducción como fuente al cuaderno que elija, sin tener que abrir NotebookLM y pegar el enlace a mano.

- **Comportamiento actual**: hoy la extensión solo exporta conversaciones de NotebookLM a PDF y conserva las fórmulas. Para añadir un vídeo de YouTube como fuente, el usuario abre NotebookLM, entra en el cuaderno y pega el enlace del vídeo.
- **Medida de éxito**: un vídeo público se añade correctamente al cuaderno seleccionado y todos los casos de error descritos en la sección 6 muestran su mensaje sin dejar el cuaderno en un estado parcial.

## 3. Requisitos Funcionales (Sintaxis EARS)

- **RF-01** (Estado): Mientras la pestaña activa muestre un vídeo de YouTube, el sistema debe ofrecer en el panel de la extensión la acción "Añadir a cuaderno".
- **RF-02** (Estado): Mientras la pestaña activa muestre una lista de reproducción de YouTube, el sistema debe ofrecer en el panel de la extensión la acción "Añadir a cuaderno".
- **RF-03** (Evento): Cuando el usuario elige "Añadir a cuaderno", el sistema debe mostrar la lista de cuadernos existentes del usuario.
- **RF-04** (Evento): Cuando el sistema muestra la lista de cuadernos, el sistema debe preseleccionar el último cuaderno al que el usuario añadió una fuente desde la extensión.
- **RF-05** (Evento): Cuando el usuario confirma el cuaderno destino desde un vídeo, el sistema debe añadir ese vídeo como fuente del cuaderno elegido.
- **RF-06** (Evento): Cuando el usuario confirma el cuaderno destino desde una lista de reproducción, el sistema debe añadir los vídeos de la lista como fuentes del cuaderno elegido.
- **RF-07** (Evento): Cuando la adición de fuentes termina correctamente, el sistema debe mostrar un aviso de que se han añadido correctamente.
- **RF-08** (Ubicuo): El sistema debe seguir ofreciendo la exportación de conversaciones de NotebookLM a PDF.
- **RF-09** (Evento): Cuando el usuario elige "Añadir a cuaderno", el sistema debe obtener la lista de cuadernos tal como está en NotebookLM en ese momento.
- **RF-10** (Complejo): Mientras la pestaña activa muestre un vídeo que se reproduce dentro de una lista de reproducción, cuando el usuario confirme el cuaderno destino, el sistema debe añadir únicamente ese vídeo.
- **RF-11** (Estado): Mientras la pestaña activa muestre YouTube, el sistema debe ocultar en el panel la acción de exportar a PDF.
- **RF-12** (Estado): Mientras la pestaña activa muestre NotebookLM, el sistema debe ocultar en el panel la acción "Añadir a cuaderno".
- **RF-13** (Estado): Mientras la pestaña activa no muestre un vídeo de YouTube, una lista de reproducción de YouTube ni una conversación de NotebookLM, el sistema debe mostrar en el panel un mensaje de que no hay acciones disponibles en esa página.
- **RF-14** (Evento): Cuando la adición de una lista de reproducción termina con algún vídeo omitido o rechazado, el sistema debe mostrar un resumen con el número de vídeos añadidos, ya presentes y no admitidos.
- **RF-15** (Evento): Cuando el sistema omite un vídeo porque ya es fuente del cuaderno destino, el sistema debe informar al usuario de que el vídeo ya estaba en el cuaderno.

## 4. Reglas de Negocio

- **RN-01**: Todas las funcionalidades forman parte de una única extensión y se usan desde el mismo panel. Añadir una funcionalidad no exige instalar nada más.
- **RN-02**: Cada adición tiene un único cuaderno destino, elegido por el usuario entre los cuadernos que ya existen.
- **RN-03**: Una lista de reproducción se añade completa o no se añade. Nunca se añade solo una parte de la lista por falta de espacio en el cuaderno.
- **RN-04**: Un vídeo que ya es fuente del cuaderno destino no se vuelve a añadir. En una lista, se añaden solo los vídeos que faltan.
- **RN-05**: En una lista, los vídeos que NotebookLM no admite se omiten y los demás se añaden. RN-03 solo aplica a la falta de espacio, no a los vídeos rechazados.
- **RN-06**: Los mensajes al usuario son los de la tabla de la sección 6.1.
- **RN-07**: La detección de vídeos que ya son fuente del cuaderno destino depende de lo que permita Gemini Notebook. RN-04, RF-15, CB-02 y el recuento de "ya presentes" de RF-14 solo se aplican si Gemini Notebook permite saber qué vídeos son ya fuente de un cuaderno antes de añadirlos.
- **RN-08**: Cada vídeo de una lista de reproducción se añade como una fuente independiente.
- **RN-09**: La exportación a PDF mantiene su comportamiento actual, incluida la opción "Incluir mis preguntas" y la preferencia que se recuerda.
- **RN-10**: El último cuaderno usado se sigue recordando después de cerrar y volver a abrir el navegador.
- **RN-11**: Si el cuaderno destino no admite más fuentes, añadir un solo vídeo se trata como un rechazo de NotebookLM y se aplica CB-03.
- **RN-12**: Para el límite de CB-01 solo cuentan los vídeos de la lista que todavía no están en el cuaderno.
- **RN-13**: Si Gemini Notebook no permite saber qué vídeos ya son fuente de un cuaderno, los vídeos se añaden sin esa comprobación.

## 6. Casos Borde y Comportamientos de Error

- **CB-01** (No deseado): Si los vídeos de la lista de reproducción superan las fuentes que aún admite el cuaderno destino, entonces el sistema debe mostrar un mensaje informativo sin añadir ningún vídeo.
- **CB-02** (No deseado): Si el vídeo ya es fuente del cuaderno destino, entonces el sistema debe dejar el cuaderno sin cambios.
- **CB-03** (No deseado): Si NotebookLM rechaza la adición de un vídeo, entonces el sistema debe mostrar un mensaje informativo con el motivo del error.
- **CB-04** (No deseado): Si el usuario no ha iniciado sesión en NotebookLM, entonces el sistema debe mostrar el mensaje "Para añadir fuentes debe iniciar sesión".
- **CB-05** (No deseado): Si el último cuaderno usado ya no existe, entonces el sistema debe mostrar la lista de cuadernos sin ninguno preseleccionado.
- **CB-06** (No deseado): Si una lista contiene vídeos que NotebookLM no admite, entonces el sistema debe añadir el resto de vídeos de la lista.
- **CB-07** (No deseado): Si el usuario no tiene ningún cuaderno, entonces el sistema debe mostrar un mensaje que le indique que cree un cuaderno en Gemini Notebook antes de añadir fuentes.
- **CB-08** (No deseado): Si no se puede añadir ningún vídeo de una lista, entonces el sistema debe mostrar un mensaje de que no se ha añadido ningún vídeo, con el motivo.

### 6.1 Mensajes al usuario

Textos revisados y aprobados por el usuario. Lo que va entre llaves se sustituye por el dato real.

| ID | Situación | Texto |
|---|---|---|
| M-01 | Vídeo añadido (RF-07) | Vídeo añadido a «{cuaderno}». |
| M-02 | Lista añadida completa (RF-07) | Se han añadido {n} vídeos a «{cuaderno}». |
| M-03 | Lista con omisiones (RF-14) | Se han añadido {n} de {total} vídeos a «{cuaderno}». {k} ya estaban en el cuaderno y {m} no se han podido añadir. |
| M-04 | Vídeo ya presente (RF-15, CB-02) | Este vídeo ya está en «{cuaderno}». No se ha añadido de nuevo. |
| M-05 | Lista sin espacio (CB-01) | La lista tiene {n} vídeos nuevos, pero «{cuaderno}» solo admite {m} fuentes más. No se ha añadido ningún vídeo. |
| M-06 | Vídeo rechazado (CB-03) | No se ha podido añadir el vídeo: {motivo}. |
| M-07 | Ningún vídeo de la lista añadido (CB-08) | No se ha añadido ningún vídeo de la lista: {motivo}. |
| M-08 | Sin sesión (CB-04) | Para añadir fuentes debe iniciar sesión. |
| M-09 | Sin cuadernos (CB-07) | No tiene ningún cuaderno. Cree uno en Gemini Notebook antes de añadir fuentes. |
| M-10 | Página sin acciones (RF-13) | No hay acciones disponibles en esta página. |

## 8. Fuera de Alcance

- Botón para añadir el vídeo junto al reproductor, dentro de la propia página de YouTube. Está previsto para una iteración posterior.
- Crear un cuaderno nuevo desde la extensión.
- Enlace para abrir el cuaderno después de añadir la fuente.
- Importar como fuente contenido de webs distintas de YouTube.

## 9. Criterios de Aceptación

- **CA-01** → RF-01, RF-03, RF-05, RF-07, RN-02
  - **Dado** que el usuario tiene al menos un cuaderno y la pestaña activa muestra un vídeo público de YouTube
  - **Cuando** abre el panel de la extensión, elige "Añadir a cuaderno", selecciona un cuaderno de la lista y confirma
  - **Entonces** aparece el mensaje M-01 y el vídeo figura como fuente en ese cuaderno y en ningún otro
- **CA-02** → RF-02, RF-06, RF-07, RN-08
  - **Dado** que la pestaña activa muestra una lista de reproducción de YouTube con 3 vídeos y el cuaderno destino admite al menos 3 fuentes más
  - **Cuando** el usuario elige "Añadir a cuaderno", selecciona ese cuaderno y confirma
  - **Entonces** aparece el mensaje M-02 y los 3 vídeos figuran en ese cuaderno como 3 fuentes independientes
- **CA-03** → RF-04, RN-10
  - **Dado** que el usuario añadió una fuente al cuaderno "Física" desde la extensión y después cerró y volvió a abrir el navegador
  - **Cuando** elige "Añadir a cuaderno" desde otro vídeo
  - **Entonces** la lista de cuadernos aparece con "Física" preseleccionado
- **CA-04** → RF-08, RN-01, RN-09
  - **Dado** que la pestaña activa muestra una conversación de NotebookLM
  - **Cuando** el usuario abre el panel de la extensión y exporta la conversación
  - **Entonces** se ofrece la opción "Incluir mis preguntas" con la última preferencia elegida, y obtiene el PDF con las fórmulas conservadas, usando la misma extensión que ofrece "Añadir a cuaderno" en YouTube y sin haber instalado nada más
- **CA-05** → RF-10
  - **Dado** que la pestaña activa muestra el segundo vídeo de una lista de reproducción de 5 vídeos
  - **Cuando** el usuario elige "Añadir a cuaderno", selecciona un cuaderno y confirma
  - **Entonces** solo ese vídeo figura como nueva fuente del cuaderno
- **CA-06** → RF-09, CB-05
  - **Dado** que el último cuaderno usado era "Física" y el usuario lo ha borrado en NotebookLM
  - **Cuando** elige "Añadir a cuaderno" desde un vídeo
  - **Entonces** la lista de cuadernos no incluye "Física" y no hay ningún cuaderno preseleccionado
- **CA-07** → RN-03, CB-01
  - **Dado** un cuaderno que solo admite 2 fuentes más y una lista de reproducción de 3 vídeos que no están en el cuaderno
  - **Cuando** el usuario intenta añadir la lista a ese cuaderno
  - **Entonces** aparece el mensaje M-05 y el cuaderno no tiene ninguna fuente nueva
- **CA-08** → RN-04, RN-07, RF-15, CB-02
  - **Dado** que Gemini Notebook permite saber qué vídeos ya son fuente de un cuaderno, y un cuaderno que ya tiene como fuente un vídeo concreto
  - **Cuando** el usuario intenta añadir de nuevo ese vídeo al mismo cuaderno
  - **Entonces** aparece el mensaje M-04 y el cuaderno conserva una única fuente de ese vídeo
- **CA-09** → CB-03
  - **Dado** que la pestaña activa muestra un vídeo que NotebookLM no admite como fuente
  - **Cuando** el usuario intenta añadirlo a un cuaderno
  - **Entonces** aparece el mensaje M-06 con el motivo del error y el cuaderno no tiene ninguna fuente nueva
- **CA-10** → CB-04
  - **Dado** que el usuario no ha iniciado sesión en NotebookLM y la pestaña activa muestra un vídeo de YouTube
  - **Cuando** elige "Añadir a cuaderno"
  - **Entonces** aparece el mensaje M-08
- **CA-11** → RF-11, RF-12, RF-13
  - **Dado** tres pestañas: un vídeo de YouTube, una conversación de NotebookLM y una web cualquiera
  - **Cuando** el usuario abre el panel de la extensión en cada una
  - **Entonces** en YouTube solo aparece "Añadir a cuaderno", en NotebookLM solo aparece la exportación a PDF, y en la web cualquiera aparece el mensaje M-10
- **CA-12** → RN-04, RN-07, RF-14
  - **Dado** que Gemini Notebook permite saber qué vídeos ya son fuente de un cuaderno, y una lista de 5 vídeos de la que 3 ya son fuente del cuaderno destino
  - **Cuando** el usuario añade la lista a ese cuaderno
  - **Entonces** se añaden solo los 2 que faltan y aparece el mensaje M-03 indicando 2 añadidos y 3 ya presentes
- **CA-13** → RN-05, CB-06, RF-14
  - **Dado** una lista de 4 vídeos públicos más 1 privado, ninguno en el cuaderno destino, que admite al menos 5 fuentes más
  - **Cuando** el usuario añade la lista a ese cuaderno
  - **Entonces** se añaden los 4 vídeos públicos y aparece el mensaje M-03 indicando 1 vídeo no añadido
- **CA-14** → CB-08
  - **Dado** una lista cuyos vídeos son todos privados
  - **Cuando** el usuario intenta añadirla a un cuaderno
  - **Entonces** aparece el mensaje M-07 y el cuaderno no tiene ninguna fuente nueva
- **CA-15** → CB-07
  - **Dado** que el usuario ha iniciado sesión y no tiene ningún cuaderno
  - **Cuando** elige "Añadir a cuaderno" desde un vídeo de YouTube
  - **Entonces** aparece el mensaje M-09
- **CA-16** → RN-06
  - **Dado** cada situación de la tabla 6.1
  - **Cuando** se produce durante las pruebas de CA-01 a CA-15 y CA-17 a CA-19
  - **Entonces** el texto mostrado coincide con el de la tabla
- **CA-17** → RN-11, CB-03
  - **Dado** un cuaderno que ya no admite más fuentes
  - **Cuando** el usuario intenta añadirle un vídeo
  - **Entonces** aparece el mensaje M-06 con el motivo y el cuaderno no tiene ninguna fuente nueva
- **CA-18** → RN-12, RN-07
  - **Dado** que Gemini Notebook permite saber qué vídeos ya son fuente de un cuaderno, un cuaderno que solo admite 2 fuentes más y una lista de 4 vídeos de la que 2 ya son fuente de ese cuaderno
  - **Cuando** el usuario añade la lista a ese cuaderno
  - **Entonces** se añaden los 2 vídeos que faltan y aparece el mensaje M-03 indicando 2 añadidos y 2 ya presentes
- **CA-19** → RN-13
  - **Dado** que Gemini Notebook no permite saber qué vídeos ya son fuente de un cuaderno
  - **Cuando** el usuario añade un vídeo a un cuaderno
  - **Entonces** el vídeo se añade sin comprobar si ya estaba y aparece el mensaje M-01

## 10. Supuestos y Preguntas Abiertas

**Supuestos**
- ~~**SUP-01**: Cada vídeo de una lista de reproducción se añade como una fuente independiente.~~ *(Confirmado en v1.4 → RN-08)*
- ~~**SUP-02**: La exportación a PDF mantiene su comportamiento actual, incluida la opción "Incluir mis preguntas" y la preferencia que se recuerda.~~ *(Confirmado en v1.4 → RN-09)*
- ~~**SUP-03**: El último cuaderno usado se sigue recordando después de cerrar y volver a abrir el navegador.~~ *(Confirmado en v1.4 → RN-10)*
- ~~**SUP-04**: Si el cuaderno destino no admite más fuentes, añadir un solo vídeo falla como cualquier otro rechazo de NotebookLM y se aplica CB-03.~~ *(Confirmado en v1.4 → RN-11)*
- ~~**SUP-05**: Para el límite de CB-01 solo cuentan los vídeos de la lista que todavía no están en el cuaderno.~~ *(Confirmado en v1.4 → RN-12)*
- ~~**SUP-06**: Se puede saber qué vídeos ya son fuente de un cuaderno antes de añadirlos.~~ *(Retirado en v1.3 → sustituido por RN-07)*
- ~~**SUP-07**: Si Gemini Notebook no permite saber qué vídeos ya son fuente de un cuaderno, los vídeos se añaden sin esa comprobación.~~ *(Confirmado en v1.4 → RN-13)*

**Preguntas abiertas**
- ~~**PA-01**: Si una lista de reproducción no cabe entera en el cuaderno, ¿se añade en parte o se rechaza?~~ *(Resuelta en v1.1 → RN-03, CB-01)*
- ~~**PA-02**: Si el vídeo abierto forma parte de una lista, ¿se añade el vídeo o la lista?~~ *(Resuelta en v1.1 → RF-10)*
- ~~**PA-03**: Si un vídeo ya es fuente del cuaderno, ¿qué se hace?~~ *(Resuelta en v1.1 → RN-04, CB-02)*
- ~~**PA-04**: ¿Qué aviso se muestra si NotebookLM no admite un vídeo?~~ *(Resuelta en v1.1 → CB-03)*
- ~~**PA-05**: ¿El panel muestra solo las acciones de la pestaña actual?~~ *(Resuelta en v1.1 → RF-11, RF-12, RF-13)*
- ~~**PA-06**: ¿Qué se muestra si el usuario no ha iniciado sesión?~~ *(Resuelta en v1.1 → CB-04; la parte "sin cuadernos" pasa a PA-12)*
- ~~**PA-07**: ¿Qué pasa si el último cuaderno usado se ha borrado?~~ *(Resuelta en v1.1 → RF-09, CB-05)*
- ~~**PA-08**: ¿Cómo se medirá el éxito?~~ *(Resuelta en v1.1 → Medida de éxito, sección 1)*
- ~~**PA-09**: ¿Se avisa al intentar añadir un vídeo repetido?~~ *(Resuelta en v1.2 → RF-15, M-04; condicionada a PA-14)*
- ~~**PA-10**: En una lista con vídeos ya presentes, ¿se añaden solo los que faltan?~~ *(Resuelta en v1.2 → RN-04; condicionada a PA-14)*
- ~~**PA-11**: En una lista con vídeos no admitidos, ¿se añaden los demás?~~ *(Resuelta en v1.2 → RN-05, CB-06, CB-08)*
- ~~**PA-12**: ¿Qué se muestra si el usuario no tiene ningún cuaderno?~~ *(Resuelta en v1.2 → CB-07, M-09)*
- ~~**PA-13**: ¿Qué texto tienen los mensajes?~~ *(Resuelta en v1.2 → tabla 6.1; pendiente de revisión en PA-15)*
- ~~**PA-14**: ¿Se puede saber qué vídeos ya son fuente de un cuaderno antes de añadirlos?~~ *(Resuelta en v1.3 → RN-07)*
- ~~**PA-15**: Revisión de los textos de la tabla 6.1.~~ *(Resuelta en v1.3: textos aprobados)*

## 11. Glosario

| Término | Definición |
|---|---|
| NotebookLM | Servicio de Google al que se dirige la extensión; ahora se llama Gemini Notebook. En esta spec, los dos nombres son equivalentes. |
| Cuaderno | Espacio de trabajo de NotebookLM que agrupa fuentes y conversaciones. |
| Fuente | Documento o contenido que se añade a un cuaderno para que NotebookLM lo use al responder. |
| Panel de la extensión | Ventana que se abre al pulsar el icono de la extensión en la barra del navegador. |
| Lista de reproducción | Página de YouTube que muestra una lista de vídeos como tal, sin ninguno reproduciéndose. Un vídeo que se reproduce dentro de una lista cuenta como vídeo (RF-10). |

## Changelog

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-10-12 | Versión inicial. |
| 1.1 | 2026-10-12 | Se resuelven PA-01 a PA-08. Se añaden RF-09 a RF-13, RN-03, RN-04, CB-01 a CB-05, CA-05 a CA-11, SUP-04, PA-09 a PA-13, la medida de éxito y la definición de "Lista de reproducción". CA-04 se reformula para no contradecir RF-12. |
| 1.2 | 2026-10-12 | Se resuelven PA-09 a PA-13. Se añaden RF-14, RF-15, RN-05, RN-06, CB-06 a CB-08, la tabla de mensajes 6.1, CA-12 a CA-16, SUP-05, SUP-06, PA-14, PA-15 y la equivalencia NotebookLM / Gemini Notebook en el glosario. RN-04 amplía su texto a las listas. CA-01, CA-02, CA-07 a CA-11 ahora citan los mensajes de la tabla. |
| 1.3 | 2026-10-12 | Se resuelven PA-14 y PA-15. Se añade RN-07 y SUP-07, y se retira SUP-06. CA-08 y CA-12 quedan condicionados a RN-07. Los textos de la tabla 6.1 quedan aprobados. Estado: Cerrado. |
| 1.4 | 2026-10-12 | El usuario confirma los supuestos: SUP-01 a SUP-05 y SUP-07 pasan a RN-08 a RN-13. Se añaden CA-17 a CA-19, y CA-02, CA-03 y CA-04 se amplían para cubrir RN-08 a RN-10. |
