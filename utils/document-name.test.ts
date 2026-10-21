import { describe, expect, it } from 'vitest';
import { fileNameFromUrl, proposedName, sourceName } from './document-name';

describe('proposedName (RN-06)', () => {
  it('CA-07: limpia el nombre del fichero', () => {
    expect(proposedName('https://ejemplo.es/docs/Informe_anual-2025%20(v2).pdf')).toBe('Informe anual 2025 v2');
  });

  it('quita las extensiones de Word y PowerPoint', () => {
    expect(proposedName('https://ejemplo.es/Memoria.docx')).toBe('Memoria');
    expect(proposedName('https://ejemplo.es/Clase+3.PPTX')).toBe('Clase 3');
  });

  it('conserva acentos, ñ y números', () => {
    expect(proposedName('https://ejemplo.es/Año_académico_2025.pdf')).toBe('Año académico 2025');
  });

  it('ignora la consulta y el fragmento', () => {
    expect(proposedName('https://ejemplo.es/guia.pdf?descarga=1#page=2')).toBe('guia');
  });

  it('tolera un % suelto', () => {
    expect(proposedName('https://ejemplo.es/100%_real.pdf')).toBe('100 real');
  });

  it('propone "Documento" si no queda nada del nombre', () => {
    expect(proposedName('https://ejemplo.es/(%20).pdf')).toBe('Documento');
    expect(proposedName('https://ejemplo.es/')).toBe('Documento');
  });
});

describe('sourceName (RN-07)', () => {
  const url = 'https://ejemplo.es/Informe_anual_2025.pdf';

  it('CA-05: usa el nombre editado', () => expect(sourceName(' Memoria 2025 ', url)).toBe('Memoria 2025'));
  it('CA-06: vuelve al propuesto si se deja vacío', () => expect(sourceName('  ', url)).toBe('Informe anual 2025'));
});

describe('fileNameFromUrl', () => {
  it('devuelve vacío si la URL no es válida', () => expect(fileNameFromUrl('no es una url')).toBe(''));
});
