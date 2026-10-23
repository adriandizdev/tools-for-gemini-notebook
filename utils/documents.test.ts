// @vitest-environment-options { "url": "https://ejemplo.es/curso/" }
import { describe, expect, it } from 'vitest';
import { candidateFromTab, candidatesFromScan, documentKind, mergeBySize } from './documents';
import { scanPage } from './injected/scan-page';

function scanHtml(html: string) {
  document.body.innerHTML = html;
  return candidatesFromScan(scanPage());
}

describe('documentKind (RN-01)', () => {
  it('reconoce PDF, Word y PowerPoint por la extensión', () => {
    expect(documentKind('https://e.es/a.PDF')).toBe('pdf');
    expect(documentKind('https://e.es/a.docx?v=2')).toBe('word');
    expect(documentKind('https://e.es/a.pptx')).toBe('powerpoint');
    expect(documentKind('https://e.es/a.xlsx')).toBeNull();
    expect(documentKind('https://e.es/pdf')).toBeNull();
  });

  it('no reconoce los formatos antiguos .doc y .ppt, que Gemini Notebook no admite', () => {
    expect(documentKind('https://e.es/a.doc')).toBeNull();
    expect(documentKind('https://e.es/a.ppt')).toBeNull();
  });
});

describe('búsqueda en la página', () => {
  it('CA-01: encuentra los enlaces a PDF, Word y PowerPoint, con direcciones absolutas', () => {
    const found = scanHtml(`
      <a href="temario.pdf">Temario</a>
      <a href="/docs/Practica_1.docx">Práctica</a>
      <a href="https://otra.es/clase.pptx">Clase</a>
      <a href="notas.xlsx">Notas</a>
      <a href="/inicio">Inicio</a>`);
    expect(found).toEqual([
      { url: 'https://ejemplo.es/curso/temario.pdf', fileName: 'temario.pdf', kind: 'pdf' },
      { url: 'https://ejemplo.es/docs/Practica_1.docx', fileName: 'Practica_1.docx', kind: 'word' },
      { url: 'https://otra.es/clase.pptx', fileName: 'clase.pptx', kind: 'powerpoint' },
    ]);
  });

  it('CA-02: encuentra los PDF incrustados, también sin extensión si declaran su tipo', () => {
    const found = scanHtml(`
      <iframe src="/visor/guia.pdf"></iframe>
      <embed src="/descarga?id=7" type="application/pdf">
      <object data="/ficha.pdf"></object>
      <iframe src="https://www.youtube.com/embed/abc"></iframe>`);
    expect(found.map((d) => d.url)).toEqual([
      'https://ejemplo.es/visor/guia.pdf',
      'https://ejemplo.es/descarga?id=7',
      'https://ejemplo.es/ficha.pdf',
    ]);
  });

  it('saca el documento de los visores que lo reciben como parámetro', () => {
    const found = scanHtml(
      '<iframe src="https://docs.google.com/viewer?url=https%3A%2F%2Fejemplo.es%2Fa.pdf&embedded=true"></iframe>',
    );
    expect(found.map((d) => d.url)).toEqual(['https://ejemplo.es/a.pdf']);
  });

  it('CA-27 (RN-14): de lo incrustado solo cuentan los PDF', () => {
    const found = scanHtml(
      '<iframe src="/presentacion.pptx"></iframe><iframe src="/guia.pdf"></iframe>',
    );
    expect(found.map((d) => d.kind)).toEqual(['pdf']);
  });

  it('CA-16 (RN-02): el mismo documento enlazado e incrustado aparece una vez', () => {
    const found = scanHtml(`
      <a href="/guia.pdf">Guía</a>
      <a href="/guia.pdf#page=3">Guía, página 3</a>
      <iframe src="/guia.pdf"></iframe>`);
    expect(found).toHaveLength(1);
  });

  it('ignora lo que no es http(s)', () => {
    expect(scanHtml('<a href="mailto:a@e.es?subject=a.pdf">Correo</a>')).toEqual([]);
  });
});

describe('candidateFromTab (RF-04)', () => {
  it('reconoce un PDF abierto directamente', () => {
    expect(candidateFromTab('https://e.es/a/Guia%20docente.pdf')).toEqual({
      url: 'https://e.es/a/Guia%20docente.pdf',
      fileName: 'Guia docente.pdf',
      kind: 'pdf',
    });
  });
});

describe('mergeBySize (RN-03 a RN-05)', () => {
  const a = { url: 'https://uno.es/informe.pdf', fileName: 'informe.pdf', kind: 'pdf' } as const;
  const b = { url: 'https://dos.es/informe.pdf', fileName: 'informe.pdf', kind: 'pdf' } as const;

  it('CA-17: mismo nombre y tamaño con dirección distinta → uno solo', () => {
    expect(
      mergeBySize(
        [a, b],
        new Map([
          [a.url, 100],
          [b.url, 100],
        ]),
      ),
    ).toEqual([a]);
  });

  it('CA-18: mismo nombre y tamaño distinto → los dos', () => {
    expect(
      mergeBySize(
        [a, b],
        new Map([
          [a.url, 100],
          [b.url, 200],
        ]),
      ),
    ).toEqual([a, b]);
  });

  it('CA-19: tamaño desconocido → los dos', () => {
    expect(mergeBySize([a, b], new Map([[a.url, 100]]))).toEqual([a, b]);
    expect(mergeBySize([a, b], new Map())).toEqual([a, b]);
  });

  it('mismo tamaño y nombre distinto → los dos', () => {
    const c = { ...b, fileName: 'otro.pdf' };
    expect(
      mergeBySize(
        [a, c],
        new Map([
          [a.url, 100],
          [c.url, 100],
        ]),
      ),
    ).toEqual([a, c]);
  });
});
