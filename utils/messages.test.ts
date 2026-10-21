import { describe, expect, it } from 'vitest';
import * as m from './messages';

// Textos literales de la tabla 6.1 de REQ-001 (CA-16).
describe('mensajes de REQ-001', () => {
  it('M-01', () => expect(m.videoAdded('Física')).toBe('Vídeo añadido a «Física».'));
  it('M-02', () => expect(m.playlistAdded(3, 'Física')).toBe('Se han añadido 3 vídeos a «Física».'));
  it('M-03', () =>
    expect(m.playlistPartial(2, 5, 'Física', 3, 0)).toBe(
      'Se han añadido 2 de 5 vídeos a «Física». 3 ya estaban en el cuaderno y 0 no se han podido añadir.',
    ));
  it('M-04', () =>
    expect(m.videoAlreadyPresent('Física')).toBe('Este vídeo ya está en «Física». No se ha añadido de nuevo.'));
  it('M-05', () =>
    expect(m.playlistNoRoom(3, 'Física', 2)).toBe(
      'La lista tiene 3 vídeos nuevos, pero «Física» solo admite 2 fuentes más. No se ha añadido ningún vídeo.',
    ));
  it('M-06', () =>
    expect(m.videoRejected('el vídeo es privado')).toBe('No se ha podido añadir el vídeo: el vídeo es privado.'));
  it('M-07', () =>
    expect(m.playlistNoneAdded('el vídeo es privado')).toBe(
      'No se ha añadido ningún vídeo de la lista: el vídeo es privado.',
    ));
  it('M-08', () => expect(m.NOT_LOGGED_IN).toBe('Para añadir fuentes debe iniciar sesión.'));
  it('M-09', () =>
    expect(m.NO_NOTEBOOKS).toBe('No tiene ningún cuaderno. Cree uno en Gemini Notebook antes de añadir fuentes.'));
  it('M-10', () => expect(m.NO_ACTIONS).toBe('No hay acciones disponibles en esta página.'));

  it('no duplica el punto si el motivo ya termina en punto', () => {
    expect(m.videoRejected('Vídeo privado.')).toBe('No se ha podido añadir el vídeo: Vídeo privado.');
  });
});

// Textos literales de la tabla 6.1 de REQ-002 (CA-26).
describe('mensajes de REQ-002', () => {
  it('M-11', () => expect(m.SCANNING).toBe('Buscando documentos en la página…'));
  it('M-12', () => expect(m.documentAdded('Física')).toBe('Documento añadido a «Física».'));
  it('M-13', () => expect(m.documentsAdded(3, 'Física')).toBe('Se han añadido 3 documentos a «Física».'));
  it('M-14', () =>
    expect(m.documentsPartial(2, 3, 'Física', 0, 1)).toBe(
      'Se han añadido 2 de 3 documentos a «Física». 0 ya estaban en el cuaderno y 1 no se han podido añadir.',
    ));
  it('M-15', () =>
    expect(m.documentAlreadyPresent('Física')).toBe(
      'Este documento ya está en «Física». No se ha añadido de nuevo.',
    ));
  it('M-16', () =>
    expect(m.documentsNoRoom(3, 'Física', 2)).toBe(
      'Ha seleccionado 3 documentos nuevos, pero «Física» solo admite 2 fuentes más. Seleccione menos documentos.',
    ));
  it('M-17', () =>
    expect(m.documentRejected('la web lo deniega')).toBe('No se ha podido añadir el documento: la web lo deniega.'));
  it('M-18', () =>
    expect(m.documentsNoneAdded('la web lo deniega')).toBe(
      'No se ha añadido ningún documento: la web lo deniega.',
    ));
});
