import { describe, expect, it } from 'vitest';
import { classifyTab } from './page';

describe('classifyTab', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', { kind: 'video', videoId: 'dQw4w9WgXcQ' }],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', { kind: 'video', videoId: 'dQw4w9WgXcQ' }],
    ['https://www.youtube.com/shorts/abc_DEF-123', { kind: 'video', videoId: 'abc_DEF-123' }],
    // Un vídeo que se reproduce dentro de una lista cuenta como vídeo (RF-10).
    [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&index=2',
      { kind: 'video', videoId: 'dQw4w9WgXcQ' },
    ],
    ['https://www.youtube.com/playlist?list=PL123', { kind: 'playlist', listId: 'PL123' }],
    ['https://notebook.google.com/notebook/abc-123', { kind: 'notebook' }],
    ['https://notebooklm.google.com/notebook/abc-123', { kind: 'notebook' }],
    // REQ-002: cualquier otra web busca documentos, y un PDF abierto directamente es un documento.
    ['https://example.com/watch?v=dQw4w9WgXcQ', { kind: 'web' }],
    ['http://campus.example.es/asignatura/', { kind: 'web' }],
    [
      'https://example.com/docs/guia.pdf',
      { kind: 'document', url: 'https://example.com/docs/guia.pdf' },
    ],
    // Un Word abierto en la pestaña no es un PDF abierto en el navegador: se busca como web.
    ['https://example.com/docs/guia.docx', { kind: 'web' }],
    // REQ-003: en el visor de UNIR se listan los temas en lugar de buscar documentos.
    [
      'https://visorinteractivo.unir.net/asignaturas/3128028/mis-temas',
      { kind: 'unir', subjectId: '3128028' },
    ],
    [
      'https://visorinteractivo.unir.net/asignaturas/3128028/mis-temas/412?vista=1',
      { kind: 'unir', subjectId: '3128028', topicId: '412' },
    ],
  ])('%s', (url, expected) => {
    expect(classifyTab(url)).toEqual(expected);
  });

  it.each([
    undefined,
    '',
    'chrome://extensions',
    'https://www.youtube.com/',
    'https://www.youtube.com/results?search_query=fisica',
    'https://www.youtube.com/playlist',
    'https://notebook.google.com/',
    'https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAw',
    'file:///C:/docs/guia.pdf',
    // REQ-003, SUP-02: las demás páginas del visor no tienen acción.
    'https://visorinteractivo.unir.net/asignaturas/3128028/ejercicios-practicos',
    'https://visorinteractivo.unir.net/',
  ])('no ofrece acciones en %s', (url) => {
    expect(classifyTab(url)).toEqual({ kind: 'none' });
  });
});
