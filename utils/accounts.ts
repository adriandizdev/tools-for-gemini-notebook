/** Elección de la cuenta activa y lo que se recuerda de cada cuenta (REQ-004). */

import type { Account } from './notebooklm-api';

export type AccountChoice =
  /** Ninguna cuenta con la sesión iniciada (CB-01, CB-02): M-19. */
  | { kind: 'none' }
  | { kind: 'active'; account: Account }
  /** La última cuenta usada ya no está y hay varias para elegir (CB-03): M-20. */
  | { kind: 'unavailable'; email: string };

/**
 * Cuenta activa al abrir el panel: la última usada si sigue con la sesión iniciada (RF-10); si no,
 * la única que quede (RF-11, CB-07) o, sin última cuenta, la principal del navegador (SUP-01).
 */
export function chooseAccount(accounts: Account[], lastEmail: string | undefined): AccountChoice {
  const [first] = accounts;
  if (!first) return { kind: 'none' };
  const last = accounts.find((account) => account.email === lastEmail);
  if (last) return { kind: 'active', account: last };
  if (lastEmail && accounts.length > 1) return { kind: 'unavailable', email: lastEmail };
  return { kind: 'active', account: first };
}

/**
 * Correo de la última cuenta usada. Solo se guarda en el navegador (SUP-04). En incógnito va en
 * `storage.session` y con otra clave, para que se recuerde aparte y se olvide al cerrar las ventanas
 * de incógnito (SUP-03; el background la borra entonces).
 */
export const LAST_ACCOUNT_KEY = 'last-account';
export const LAST_INCOGNITO_ACCOUNT_KEY = 'last-account-incognito';

/** Último cuaderno de cada cuenta: `{ [correo]: id del cuaderno }` en storage.local (RN-02). */
export const LAST_NOTEBOOKS_KEY = 'last-notebooks';
/** Clave anterior a REQ-004, con un solo cuaderno para todas las cuentas. */
export const LEGACY_LAST_NOTEBOOK_KEY = 'last-notebook';

const lastAccountStorage = () =>
  browser.extension.inIncognitoContext
    ? { area: browser.storage.session, key: LAST_INCOGNITO_ACCOUNT_KEY }
    : { area: browser.storage.local, key: LAST_ACCOUNT_KEY };

export async function getLastAccount(): Promise<string | undefined> {
  const { area, key } = lastAccountStorage();
  const value = (await area.get(key))[key];
  return typeof value === 'string' ? value : undefined;
}

export async function setLastAccount(email: string): Promise<void> {
  const { area, key } = lastAccountStorage();
  await area.set({ [key]: email });
}

async function lastNotebooks(): Promise<Record<string, string>> {
  const value: unknown = (await browser.storage.local.get(LAST_NOTEBOOKS_KEY))[LAST_NOTEBOOKS_KEY];
  return value && typeof value === 'object' ? (value as Record<string, string>) : {};
}

export async function getLastNotebook(email: string): Promise<string | undefined> {
  return (await lastNotebooks())[email];
}

export async function setLastNotebook(email: string, notebookId: string): Promise<void> {
  await browser.storage.local.set({
    [LAST_NOTEBOOKS_KEY]: { ...(await lastNotebooks()), [email]: notebookId },
  });
}
