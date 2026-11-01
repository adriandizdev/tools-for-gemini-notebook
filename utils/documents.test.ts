// @vitest-environment-options { "url": "https://ejemplo.es/curso/" }
import { afterEach, describe, expect, it, vi } from 'vitest';
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

describe('visores que dibujan en canvas (RF-24)', () => {
  const PDF = 'https://cdn.example/d/1f2e.pdf';
  const data = { id: 1, name: 'Guía del curso', resource: PDF };
  const pageWith = (value: string, param = 'datos') => ({
    url: `https://visor.example/ver?${param}=${encodeURIComponent(value)}`,
    embedded: false,
    type: null,
  });

  function stubRequests(...urls: string[]) {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue(
      urls.map((name) => ({ name }) as PerformanceEntry),
    );
  }

  afterEach(() => {
    vi.restoreAllMocks();
    history.replaceState(null, '', '/curso/');
  });

  it('CA-33 (RN-17): saca el documento y su título del JSON de un parámetro de la URL', () => {
    expect(candidatesFromScan([pageWith(JSON.stringify(data))])).toEqual([
      { url: PDF, fileName: '1f2e.pdf', kind: 'pdf', title: 'Guía del curso' },
    ]);
  });

  it('no dependen del nombre del parámetro ni de la clave del JSON', () => {
    const other = JSON.stringify({ titulo: 'x', fichero: PDF });
    expect(candidatesFromScan([pageWith(other, 'recurso')]).map((d) => d.url)).toEqual([PDF]);
  });

  it('acepta una dirección absoluta en cualquier parámetro', () => {
    expect(candidatesFromScan([pageWith(PDF, 'doc')]).map((d) => d.url)).toEqual([PDF]);
  });

  it('una dirección relativa solo vale en los parámetros de los visores', () => {
    expect(candidatesFromScan([pageWith('a.pdf', 'nombre')])).toEqual([]);
    expect(candidatesFromScan([pageWith('/a.pdf', 'file')]).map((d) => d.url)).toEqual([
      'https://visor.example/a.pdf',
    ]);
  });

  it('busca también en los objetos y listas anidados', () => {
    const nested = JSON.stringify({ data: [{ id: 1 }, { title: 'Otra guía', file: PDF }] });
    expect(candidatesFromScan([pageWith(nested)])).toMatchObject([
      { url: PDF, title: 'Otra guía' },
    ]);
  });

  it('sin nombre en el JSON no propone título', () => {
    expect(candidatesFromScan([pageWith(JSON.stringify({ resource: PDF }))])[0]).not.toHaveProperty(
      'title',
    );
  });

  it('un JSON inválido o sin documento no da candidatos', () => {
    expect(candidatesFromScan([pageWith('{no es json')])).toEqual([]);
    expect(candidatesFromScan([pageWith('{"resource":"https://e.es/inicio"}')])).toEqual([]);
    expect(candidatesFromScan([pageWith('{"resource":"ftp://e.es/a.pdf"}')])).toEqual([]);
  });

  it('una página sin documento en su URL no da candidatos', () => {
    expect(scanHtml('<canvas></canvas>')).toEqual([]);
  });

  it('encuentra el documento en la URL de la pestaña', () => {
    history.replaceState(null, '', `/ver?datos=${encodeURIComponent(JSON.stringify(data))}`);
    expect(scanHtml('<canvas></canvas>').map((d) => d.url)).toEqual([PDF]);
  });

  it('CA-34 (RN-14): encuentra el PDF que la página ha pedido; solo cuentan los PDF', () => {
    stubRequests('https://e.es/a.pdf?v=1', 'https://e.es/b.pptx', 'https://e.es/app.js');
    expect(scanHtml('').map((d) => d.url)).toEqual(['https://e.es/a.pdf?v=1']);
  });

  it('RN-02: en la URL y en las peticiones aparece una vez y conserva el título', () => {
    history.replaceState(null, '', `/ver?datos=${encodeURIComponent(JSON.stringify(data))}`);
    stubRequests(PDF);
    expect(scanHtml('')).toMatchObject([{ url: PDF, title: data.name }]);
  });
});

describe('marcos de la página (RF-25)', () => {
  const S3 = 'https://s3.example/programacion';

  function scanFrame(html: string, isTopFrame: boolean) {
    document.body.innerHTML = html;
    return scanPage(isTopFrame);
  }

  afterEach(() => {
    history.replaceState(null, '', '/curso/');
  });

  it('CA-35: encuentra el PDF de un iframe anidado, sin listar la página intermedia', () => {
    const items = [
      ...scanFrame(`<iframe src="${S3}/programacion.html"></iframe>`, true),
      ...scanFrame(`<iframe src="${S3}/programacion.pdf"></iframe>`, false),
    ];
    expect(candidatesFromScan(items).map((d) => d.url)).toEqual([`${S3}/programacion.pdf`]);
  });

  it('CA-36 (RN-02): el mismo PDF en dos marcos aparece una vez y conserva el título', () => {
    const pdf = `${S3}/programacion.pdf`;
    const data = JSON.stringify({ name: 'Programación', resource: pdf });
    history.replaceState(null, '', `/ver?datos=${encodeURIComponent(data)}`);
    const items = [...scanFrame('', true), ...scanFrame(`<iframe src="${pdf}"></iframe>`, false)];
    expect(candidatesFromScan(items)).toMatchObject([{ url: pdf, title: 'Programación' }]);
    expect(candidatesFromScan(items)).toHaveLength(1);
  });

  it('un marco no devuelve su dirección, pero sí sus enlaces e incrustados', () => {
    history.replaceState(null, '', '/ver?file=/oculto.pdf#access_token=secreto');
    const items = scanFrame('<a href="/a.pdf">A</a><iframe src="/b.pdf"></iframe>', false);
    expect(items.map((item) => item.url)).toEqual([
      'https://ejemplo.es/a.pdf',
      'https://ejemplo.es/b.pdf',
    ]);
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
