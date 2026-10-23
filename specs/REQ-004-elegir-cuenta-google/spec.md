# spec.md: REQ-004 - Elegir la cuenta de Google con la que se importa

| Campo | Valor |
|---|---|
| **ID** | REQ-004 |
| **Estado** | Cerrado |
| **Versión** | 1.1 |
| **Fecha** | 2026-10-23 |
| **Depende de** | REQ-001 |

## 1. Contexto

El usuario de la extensión puede tener abiertas en el navegador varias cuentas de Google con la sesión iniciada en Gemini Notebook. Este requisito le permite elegir con qué cuenta importa contenido, de modo que vea los cuadernos de esa cuenta y añada las fuentes a ellos. Además, revisa cómo se comprueba la sesión: si no hay ninguna cuenta con la sesión iniciada, el panel lo indica y remite a Gemini Notebook para iniciarla, y en una ventana de incógnito solo cuentan las cuentas con la sesión iniciada en ella.

- **Comportamiento actual**: la extensión trabaja siempre con una única cuenta y el usuario no puede elegirla. Si no hay sesión, muestra M-08 ("Para añadir fuentes debe iniciar sesión."), que no dice dónde iniciarla. En una ventana de incógnito sin ninguna sesión iniciada, el panel muestra igualmente los cuadernos de una cuenta con la sesión iniciada en las ventanas normales.
- **Relación con REQ-001, REQ-002 y REQ-003**: este requisito afecta a todas las acciones de importar de esos requisitos (vídeos y listas de YouTube, documentos de una web y temas del visor de UNIR). Cambia en ellos tres puntos: la lista de cuadernos pasa a ser la de la cuenta activa, el último cuaderno usado se recuerda por cuenta (REQ-001 RF-04) y el mensaje M-08 se sustituye por M-19. REQ-001 v1.7, REQ-002 v1.4 y REQ-003 v1.3 recogen estos cambios.
- **Medida de éxito**: con dos cuentas con la sesión iniciada, el usuario añade una fuente a un cuaderno de la cuenta que no es la principal del navegador sin salir del panel. En una ventana de incógnito sin sesión, el panel no muestra ningún cuaderno.

## 3. Requisitos Funcionales (Sintaxis EARS)

- **RF-01** (Evento): Cuando el usuario abre el panel en una página con alguna acción de importar de REQ-001, REQ-002 o REQ-003, el sistema debe obtener las cuentas de Google que tienen la sesión iniciada en Gemini Notebook.
- **RF-02** (Estado): Mientras haya más de una cuenta con la sesión iniciada, el sistema debe mostrar el botón de avatar en la esquina superior derecha del panel.
- **RF-03** (Estado): Mientras haya una sola cuenta con la sesión iniciada, el sistema debe ocultar el botón de avatar.
- **RF-04** (Evento): Cuando el usuario pulsa el botón de avatar, el sistema debe mostrar el cuadro de cuentas con el correo de cada cuenta con la sesión iniciada.
- **RF-05** (Ubicuo): El sistema debe marcar en el cuadro de cuentas cuál es la cuenta activa.
- **RF-06** (Evento): Cuando el usuario elige una cuenta en el cuadro de cuentas, el sistema debe convertirla en la cuenta activa.
- **RF-07** (Evento): Cuando cambia la cuenta activa, el sistema debe mostrar la lista de cuadernos de esa cuenta tal como está en Gemini Notebook en ese momento.
- **RF-08** (Ubicuo): El sistema debe añadir las fuentes a los cuadernos de la cuenta activa.
- **RF-09** (Evento): Cuando cambia la cuenta activa, el sistema debe recordarla como la última cuenta usada.
- **RF-10** (Evento): Cuando el usuario abre el panel y la última cuenta usada sigue con la sesión iniciada, el sistema debe usarla como cuenta activa.
- **RF-11** (Evento): Cuando el usuario abre el panel con una sola cuenta con la sesión iniciada, el sistema debe usarla como cuenta activa.
- **RF-12** (Evento): Cuando el sistema muestra la lista de cuadernos de una cuenta, el sistema debe preseleccionar el último cuaderno al que se añadió una fuente desde esa cuenta.
- **RF-13** (Estado): Mientras se estén añadiendo fuentes, el sistema debe desactivar el botón de avatar.
- **RF-14** (Evento): Cuando el sistema detecta que la cuenta activa ya no tiene la sesión iniciada, el sistema debe retirar del panel las acciones de añadir.
- **RF-15** (Evento): Cuando el sistema detecta que la cuenta activa ya no tiene la sesión iniciada, el sistema debe mostrar el mensaje M-19.

## 4. Reglas de Negocio

- **RN-01**: Solo cuentan las cuentas con la sesión iniciada en Gemini Notebook en el mismo tipo de ventana que la pestaña activa. En una ventana normal cuentan las sesiones de las ventanas normales. En una ventana de incógnito cuentan solo las sesiones iniciadas en incógnito.
- **RN-02**: Cada cuenta tiene su propio último cuaderno usado. Elegir un cuaderno en una cuenta no cambia el que se recuerda para las demás.
- **RN-03**: La última cuenta usada se recuerda siempre, aunque se cierre el panel.
- **RN-04**: La extensión no inicia ni cierra sesiones de Google. Si no hay sesión, solo informa de que hay que iniciarla en Gemini Notebook.
- **RN-05**: Una importación termina en la cuenta en la que empezó.
- **RN-06**: Los mensajes al usuario son los de la tabla de la sección 6.1.
- **RN-07**: No siempre es posible saber antes de añadir una fuente que la sesión de la cuenta activa se ha cerrado. En ese caso, el error que devuelve Gemini Notebook al añadir se trata según CB-08.

## 6. Casos Borde y Comportamientos de Error

- **CB-01** (No deseado): Si no hay ninguna cuenta con la sesión iniciada en Gemini Notebook, entonces el sistema debe mostrar el mensaje M-19 en lugar de la lista de cuadernos.
- **CB-02** (No deseado): Si el panel se abre en una ventana de incógnito sin ninguna cuenta con la sesión iniciada en incógnito, entonces el sistema debe mostrar el mensaje M-19 aunque haya cuentas con la sesión iniciada en las ventanas normales.
- **CB-03** (No deseado): Si la última cuenta usada ya no tiene la sesión iniciada y hay más de una cuenta con la sesión iniciada, entonces el sistema debe mostrar el mensaje M-20 sin cuenta activa ni lista de cuadernos hasta que el usuario elija una cuenta en el cuadro de cuentas.
- ~~**CB-04** (No deseado): Si la última cuenta usada ya no tiene la sesión iniciada y solo queda una cuenta con la sesión iniciada, entonces el sistema debe usar esa cuenta como cuenta activa y mostrar el mensaje M-20.~~ *(Retirado en v1.1 → CB-07)*
- **CB-05** (No deseado): Si la cuenta activa no tiene ningún cuaderno, entonces el sistema debe mostrar el mensaje M-09.
- **CB-06** (No deseado): Si el último cuaderno usado de la cuenta activa ya no existe, entonces el sistema debe mostrar la lista de cuadernos de esa cuenta sin ninguno preseleccionado.
- **CB-07** (No deseado): Si la última cuenta usada ya no tiene la sesión iniciada y solo queda una cuenta con la sesión iniciada, entonces el sistema debe usar esa cuenta como cuenta activa sin mostrar el mensaje M-20.
- **CB-08** (No deseado): Si Gemini Notebook rechaza una fuente porque la cuenta activa no tiene la sesión iniciada, entonces el sistema debe mostrar el mensaje M-19.

### 6.1 Mensajes al usuario

Lo que va entre llaves se sustituye por el dato real. M-09 es el texto aprobado en REQ-001, sin cambios.

| ID | Situación | Texto |
|---|---|---|
| M-09 | La cuenta activa no tiene cuadernos (CB-05) | No tiene ningún cuaderno. Cree uno en Gemini Notebook antes de añadir fuentes. |
| M-19 | Ninguna cuenta con la sesión iniciada, o la cuenta activa la ha cerrado (CB-01, CB-02, CB-08, RF-15). Sustituye a M-08 en REQ-001, REQ-002 y REQ-003. | Para importar contenido debe iniciar sesión en Gemini Notebook. |
| M-20 | La última cuenta usada ya no está disponible y hay varias cuentas para elegir (CB-03) | La cuenta {correo} ya no está disponible. Elija una cuenta para continuar. |

## 8. Fuera de Alcance

- Iniciar o cerrar sesión en Google o en Gemini Notebook desde la extensión.
- La exportación de conversaciones a PDF, que no depende de la cuenta.
- Las cuentas con la sesión iniciada en otros perfiles del navegador.
- Mostrar la foto o el nombre de las cuentas.

## 9. Criterios de Aceptación

- **CA-01** → RF-01, RF-02, RF-04, RF-05
  - **Dado** un navegador con dos cuentas con la sesión iniciada en Gemini Notebook, ana@gmail.com y ana.trabajo@gmail.com, y la pestaña activa en un vídeo de YouTube
  - **Cuando** el usuario abre el panel y pulsa el botón de avatar
  - **Entonces** el botón de avatar está en la esquina superior derecha y el cuadro de cuentas muestra los dos correos, con la cuenta activa marcada
- **CA-02** → RF-03, RF-11
  - **Dado** un navegador con una sola cuenta con la sesión iniciada
  - **Cuando** el usuario abre el panel en un vídeo de YouTube
  - **Entonces** no aparece el botón de avatar y la lista muestra los cuadernos de esa cuenta
- **CA-03** → RF-06, RF-07, RF-08
  - **Dado** dos cuentas con la sesión iniciada, la cuenta activa ana@gmail.com y la cuenta ana.trabajo@gmail.com con un cuaderno "Proyecto" que no existe en la otra
  - **Cuando** el usuario elige ana.trabajo@gmail.com en el cuadro de cuentas y añade el vídeo a "Proyecto"
  - **Entonces** la lista pasa a mostrar los cuadernos de ana.trabajo@gmail.com y el vídeo figura como fuente en "Proyecto" de esa cuenta
- **CA-04** → RF-09, RF-10, RN-03
  - **Dado** dos cuentas con la sesión iniciada y que el usuario eligió ana.trabajo@gmail.com en el cuadro de cuentas
  - **Cuando** cierra el panel y lo vuelve a abrir en otra página con acción de importar
  - **Entonces** la cuenta activa es ana.trabajo@gmail.com
- **CA-05** → RF-12, RN-02
  - **Dado** que el último cuaderno usado es "Física" en ana@gmail.com y "Proyecto" en ana.trabajo@gmail.com
  - **Cuando** el usuario cambia la cuenta activa de una a otra
  - **Entonces** en ana@gmail.com aparece "Física" preseleccionado y en ana.trabajo@gmail.com aparece "Proyecto" preseleccionado
- **CA-06** → CB-06
  - **Dado** que el último cuaderno usado de la cuenta activa se ha borrado en Gemini Notebook
  - **Cuando** el usuario abre el panel
  - **Entonces** la lista muestra los cuadernos de esa cuenta sin ninguno preseleccionado
- **CA-07** → RF-13, RN-05
  - **Dado** dos cuentas con la sesión iniciada y una lista de reproducción que se está añadiendo a un cuaderno de la cuenta activa
  - **Cuando** el usuario intenta pulsar el botón de avatar antes de que termine
  - **Entonces** el botón está desactivado y todos los vídeos acaban como fuentes en el cuaderno de la cuenta en la que empezó la importación
- **CA-08** → CB-01, RN-04
  - **Dado** un navegador sin ninguna cuenta con la sesión iniciada en Gemini Notebook
  - **Cuando** el usuario abre el panel en un vídeo de YouTube, en una web con documentos y en el visor de UNIR
  - **Entonces** en los tres casos aparece el mensaje M-19 en lugar de la lista de cuadernos y el panel no ofrece ninguna acción para iniciar sesión
- **CA-09** → CB-02, RN-01
  - **Dado** una cuenta con la sesión iniciada en las ventanas normales y una ventana de incógnito sin ninguna sesión iniciada
  - **Cuando** el usuario abre el panel en esa ventana de incógnito en un vídeo de YouTube
  - **Entonces** aparece el mensaje M-19 y no se muestra ningún cuaderno
- **CA-10** → RN-01
  - **Dado** la cuenta ana@gmail.com con la sesión iniciada en las ventanas normales y la cuenta ana.trabajo@gmail.com con la sesión iniciada solo en incógnito
  - **Cuando** el usuario abre el panel en una ventana de incógnito
  - **Entonces** no aparece el botón de avatar y la lista muestra los cuadernos de ana.trabajo@gmail.com
- **CA-11** → CB-03
  - **Dado** que la última cuenta usada es ana.trabajo@gmail.com, que ya no tiene la sesión iniciada, y que hay otras dos cuentas con la sesión iniciada
  - **Cuando** el usuario abre el panel
  - **Entonces** aparece el mensaje M-20 con ana.trabajo@gmail.com, no se muestra ninguna lista de cuadernos ni hay cuenta activa, y al elegir una cuenta en el cuadro de cuentas aparece la lista de cuadernos de esa cuenta
- **CA-12** → CB-07
  - **Dado** que la última cuenta usada es ana.trabajo@gmail.com, que ya no tiene la sesión iniciada, y que solo ana@gmail.com tiene la sesión iniciada
  - **Cuando** el usuario abre el panel
  - **Entonces** no aparece el mensaje M-20, la cuenta activa es ana@gmail.com y la lista muestra sus cuadernos
- **CA-13** → CB-05
  - **Dado** dos cuentas con la sesión iniciada, una de ellas sin ningún cuaderno
  - **Cuando** el usuario elige la cuenta sin cuadernos en el cuadro de cuentas
  - **Entonces** aparece el mensaje M-09
- **CA-14** → RN-06
  - **Dado** cada situación de la tabla 6.1
  - **Cuando** se produce durante las pruebas de CA-01 a CA-13, CA-15 y CA-16
  - **Entonces** el texto mostrado coincide con el de la tabla
- **CA-15** → RF-14, RF-15
  - **Dado** el panel abierto en un vídeo de YouTube con la lista de cuadernos de la cuenta activa
  - **Cuando** el usuario cierra la sesión de esa cuenta en Gemini Notebook y el sistema lo detecta
  - **Entonces** el panel deja de ofrecer "Añadir a cuaderno" y aparece el mensaje M-19
- **CA-16** → CB-08, RN-07
  - **Dado** el panel abierto con la lista de cuadernos de la cuenta activa y que el usuario ha cerrado la sesión de esa cuenta sin que el sistema lo haya detectado
  - **Cuando** el usuario pulsa "Añadir a cuaderno"
  - **Entonces** aparece el mensaje M-19 y no se añade ninguna fuente

## 10. Supuestos y Preguntas Abiertas

**Supuestos** (confirmados por el usuario en v1.1)
- **SUP-01**: Si hay varias cuentas con la sesión iniciada y todavía no hay última cuenta usada (por ejemplo, en el primer uso), la cuenta activa es la cuenta principal del navegador y no se muestra ningún aviso.
- **SUP-02**: En CB-03, el cuadro de cuentas no se abre solo. El usuario lo abre con el botón de avatar.
- **SUP-03**: La última cuenta usada se recuerda por separado para las ventanas normales y para las de incógnito, y la de incógnito se olvida al cerrar todas las ventanas de incógnito.
- **SUP-04**: La extensión no guarda ni envía a ningún servicio los correos de las cuentas. Solo los muestra en el cuadro de cuentas y en M-20.
- **SUP-05**: El botón de avatar tiene un nombre que leen los lectores de pantalla (por ejemplo, "Elegir cuenta") y se puede usar con el teclado.
- **SUP-06**: El cuadro de cuentas se cierra al elegir una cuenta o al pulsar fuera de él.

**Preguntas abiertas**
- ~~**PA-01**: ¿Se actualizan REQ-001, REQ-002 y REQ-003 para reflejar lo descrito en *Relación con REQ-001, REQ-002 y REQ-003*?~~ *(Resuelta en v1.1: REQ-001 v1.7, REQ-002 v1.4 y REQ-003 v1.3)*
- ~~**PA-02**: En CB-04 no hay ninguna cuenta que elegir, pero M-20 dice "Elija una cuenta para continuar". ¿Se mantiene ese texto o se usa otro para ese caso?~~ *(Resuelta en v1.1: con una sola cuenta no se muestra M-20 → CB-07)*
- ~~**PA-03**: Si la sesión de la cuenta activa se cierra con el panel abierto y el usuario intenta añadir una fuente, ¿qué ocurre?~~ *(Resuelta en v1.1 → RF-14, RF-15, RN-07, CB-08)*

## 11. Glosario

| Término | Definición |
|---|---|
| Gemini Notebook | Servicio de Google al que se dirige la extensión, antes llamado NotebookLM. |
| Cuenta con la sesión iniciada | Cuenta de Google con la que el usuario ha iniciado sesión en Gemini Notebook en el navegador, en el mismo tipo de ventana que la pestaña activa (RN-01). |
| Cuenta activa | Cuenta cuyos cuadernos muestra el panel y a la que se añaden las fuentes. |
| Última cuenta usada | Última cuenta que fue la cuenta activa en el panel. |
| Botón de avatar | Botón pequeño y minimalista con el dibujo de un usuario, en la esquina superior derecha del panel, que abre el cuadro de cuentas. |
| Cuadro de cuentas | Cuadro que muestra el correo de cada cuenta con la sesión iniciada y marca la cuenta activa. |
| Ventana de incógnito | Ventana del navegador que no comparte las sesiones iniciadas en las ventanas normales. |

## Changelog

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-10-23 | Versión inicial. |
| 1.1 | 2026-10-23 | Se resuelven PA-01 a PA-03 y el usuario confirma SUP-01 a SUP-06. Se retira CB-04, sustituido por CB-07: con una sola cuenta no se muestra M-20. Se añaden RF-14, RF-15, RN-07 y CB-08 (sesión cerrada con el panel abierto), y CA-15 y CA-16. CA-12 y la tabla 6.1 se ajustan. REQ-001, REQ-002 y REQ-003 se actualizan. Estado: Cerrado. |
