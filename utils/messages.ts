/** Mensajes al usuario de REQ-001 (tabla 6.1 de la spec). Los textos están aprobados: no cambiarlos. */

export const videoAdded = (notebook: string) => `Vídeo añadido a «${notebook}».`; // M-01

export const playlistAdded = (n: number, notebook: string) =>
  `Se han añadido ${n} vídeos a «${notebook}».`; // M-02

export const playlistPartial = (n: number, total: number, notebook: string, k: number, m: number) =>
  `Se han añadido ${n} de ${total} vídeos a «${notebook}». ${k} ya estaban en el cuaderno y ${m} no se han podido añadir.`; // M-03

export const videoAlreadyPresent = (notebook: string) =>
  `Este vídeo ya está en «${notebook}». No se ha añadido de nuevo.`; // M-04

export const playlistNoRoom = (n: number, notebook: string, m: number) =>
  `La lista tiene ${n} vídeos nuevos, pero «${notebook}» solo admite ${m} fuentes más. No se ha añadido ningún vídeo.`; // M-05

export const videoRejected = (reason: string) =>
  `No se ha podido añadir el vídeo: ${clean(reason)}.`; // M-06

export const playlistNoneAdded = (reason: string) =>
  `No se ha añadido ningún vídeo de la lista: ${clean(reason)}.`; // M-07

export const NOT_LOGGED_IN = 'Para añadir fuentes debe iniciar sesión.'; // M-08

export const NO_NOTEBOOKS =
  'No tiene ningún cuaderno. Cree uno en Gemini Notebook antes de añadir fuentes.'; // M-09

export const NO_ACTIONS = 'No hay acciones disponibles en esta página.'; // M-10

// Mensajes de REQ-002 (tabla 6.1 de su spec). M-08, M-09 y M-10 se comparten con REQ-001.

export const SCANNING = 'Buscando documentos en la página…'; // M-11

export const documentAdded = (notebook: string) => `Documento añadido a «${notebook}».`; // M-12

export const documentsAdded = (n: number, notebook: string) =>
  `Se han añadido ${n} documentos a «${notebook}».`; // M-13

export const documentsPartial = (
  n: number,
  total: number,
  notebook: string,
  k: number,
  m: number,
) =>
  `Se han añadido ${n} de ${total} documentos a «${notebook}». ${k} ya estaban en el cuaderno y ${m} no se han podido añadir.`; // M-14

export const documentAlreadyPresent = (notebook: string) =>
  `Este documento ya está en «${notebook}». No se ha añadido de nuevo.`; // M-15

export const documentsNoRoom = (n: number, notebook: string, m: number) =>
  `Ha seleccionado ${n} documentos nuevos, pero «${notebook}» solo admite ${m} fuentes más. Seleccione menos documentos.`; // M-16

export const documentRejected = (reason: string) =>
  `No se ha podido añadir el documento: ${clean(reason)}.`; // M-17

export const documentsNoneAdded = (reason: string) =>
  `No se ha añadido ningún documento: ${clean(reason)}.`; // M-18

/** El motivo va seguido de un punto en la tabla: se quita el suyo para no duplicarlo. */
const clean = (reason: string) => reason.trim().replace(/\.+$/, '');
