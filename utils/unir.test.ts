import { describe, expect, it } from 'vitest';
import topics from './__fixtures__/unir/user-topics.json';
import {
  CAMPUS_SESSION_EXPIRED,
  TOPIC_NOT_DELIVERED,
  parseVisorPath,
  topicPageUrl,
  topicPdfUrl,
  topicsFromResponse,
} from './unir';

describe('parseVisorPath', () => {
  it('RF-01: la página de la asignatura', () =>
    expect(parseVisorPath('/asignaturas/3128028/mis-temas')).toEqual({ subjectId: '3128028' }));
  it('RF-02: la página de un tema', () =>
    expect(parseVisorPath('/asignaturas/3128028/mis-temas/3128305/')).toEqual({
      subjectId: '3128028',
      topicId: '3128305',
    }));
  it.each([
    '/',
    '/asignaturas/3128028',
    '/asignaturas/3128028/ejercicios-practicos',
    '/asignaturas/1/mis-temas/2/3',
  ])('SUP-02: %s no tiene acción', (path) => expect(parseVisorPath(path)).toBeNull());
});

describe('topicsFromResponse', () => {
  it('CA-01: todos los temas en el orden del visor, con su título', () => {
    expect(topicsFromResponse(topics)).toEqual([
      { topicId: '3128029', title: 'Tema 1. Panorama general de la reutilización de software' },
      { topicId: '3128169', title: 'Tema 2. Introducción a los patrones de diseño' },
      { topicId: '3128305', title: 'Tema 3. Patrones creacionales' },
    ]);
  });

  it('CA-02: solo el tema de la página', () => {
    expect(topicsFromResponse(topics, '3128305')).toEqual([
      { topicId: '3128305', title: 'Tema 3. Patrones creacionales' },
    ]);
  });

  it.each([null, {}, { topics: 'x' }, { topics: [{ topicId: 1 }, { title: 'Sin id' }] }])(
    'SUP-08: ningún tema si la respuesta es %j',
    (body) => expect(topicsFromResponse(body)).toEqual([]),
  );
});

describe('topicPdfUrl', () => {
  const url = 'https://cms.unir.net/file/abc/esl-ES';

  it('RN-01: la dirección del PDF del tema', () =>
    expect(topicPdfUrl({ status: 200, body: { filename: 'Tema 1.pdf', downloadUrl: url } })).toBe(
      url,
    ));
  it('CB-03: sesión del campus caducada', () =>
    expect(() => topicPdfUrl({ status: 401, body: null })).toThrow(CAMPUS_SESSION_EXPIRED));
  it.each([
    { status: 500, body: null },
    { status: 0, body: null },
    { status: 200, body: { status: 'error' } },
  ])('CB-03: el visor no entrega el tema (%j)', (result) =>
    expect(() => topicPdfUrl(result)).toThrow(TOPIC_NOT_DELIVERED),
  );
});

it('topicPageUrl', () =>
  expect(topicPageUrl('3128028', '101')).toBe(
    'https://visorinteractivo.unir.net/asignaturas/3128028/mis-temas/101',
  ));
