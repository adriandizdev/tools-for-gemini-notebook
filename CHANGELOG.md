# Changelog

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido

- Elegir la cuenta de Google con la que se importa: botón de avatar y cuadro de cuentas cuando hay varias con la sesión iniciada (REQ-004).

### Cambiado

- El último cuaderno usado se recuerda por cuenta.
- Sin sesión, el panel indica que hay que iniciarla en Gemini Notebook (M-19, sustituye a M-08).
- En incógnito solo cuentan las sesiones iniciadas en incógnito (`incognito: "split"`).

## [1.0.0] - 2026-10-22

### Añadido

- Añadir como fuentes los temas del visor de contenidos de UNIR (REQ-003).
- Añadir como fuentes los documentos PDF, Word y PowerPoint de cualquier web (REQ-002).
- Añadir vídeos y listas de reproducción de YouTube como fuentes de un cuaderno (REQ-001).
- Opción para incluir o excluir las preguntas del usuario en el PDF.
- Compatibilidad con el dominio de Gemini Notebook (`notebook.google.com`).
- Exportar conversaciones de NotebookLM a PDF conservando las fórmulas.

### Cambiado

- La extensión pasa a llamarse **NotebookLM Tools** y agrupa todas las funcionalidades en un único panel.
