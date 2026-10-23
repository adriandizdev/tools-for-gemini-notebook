import { chooseAccount, getLastAccount, setLastAccount } from '@/utils/accounts';
import { NOT_LOGGED_IN, accountUnavailable } from '@/utils/strings';
import type { Account } from '@/utils/notebooklm-api';
import { LIST_ACCOUNTS, type ListAccountsResponse } from '@/utils/protocol';
import type { StatusKind } from './main';

/** Lo que las acciones de importar necesitan de la cuenta activa (REQ-004). */
export interface AccountSession {
  /** Cuenta activa; `undefined` mientras el usuario no elija una (CB-03). */
  readonly current: Account | undefined;
  /** Llama a `listener` con la cuenta activa ahora, si la hay, y cada vez que cambie (RF-07). */
  watch(listener: (account: Account) => void): void;
  /** Mientras se añaden fuentes no se puede cambiar de cuenta (RF-13, RN-05). */
  setBusy(busy: boolean): void;
  /** La cuenta activa ya no tiene la sesión iniciada: se retiran las acciones (RF-14, RF-15). */
  signedOut(): void;
}

/**
 * Obtiene las cuentas con la sesión iniciada al abrir el panel (RF-01) y elige la activa. Sin
 * ninguna, oculta `section` y muestra M-19 (CB-01, CB-02); entonces devuelve `undefined`.
 */
export async function setupAccounts(
  section: HTMLElement,
  showStatus: (message: string, kind?: StatusKind) => void,
): Promise<AccountSession | undefined> {
  const button = document.querySelector<HTMLButtonElement>('#account-button')!;
  const menu = document.querySelector<HTMLDivElement>('#account-menu')!;

  let response: ListAccountsResponse;
  try {
    response = await browser.runtime.sendMessage({ type: LIST_ACCOUNTS });
  } catch (error) {
    response = { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
  if (!response.ok) {
    section.hidden = true;
    showStatus(response.message);
    return undefined;
  }

  const { accounts } = response;
  const choice = chooseAccount(accounts, await getLastAccount().catch(() => undefined));
  if (choice.kind === 'none') {
    section.hidden = true;
    showStatus(NOT_LOGGED_IN, 'info');
    return undefined;
  }

  let current = choice.kind === 'active' ? choice.account : undefined;
  const listeners: ((account: Account) => void)[] = [];

  if (choice.kind === 'unavailable') {
    // CB-03: sin cuenta activa ni cuadernos hasta que elija una; el cuadro no se abre solo (SUP-02).
    section.hidden = true;
    showStatus(accountUnavailable(choice.email), 'info');
  } else {
    void setLastAccount(choice.account.email).catch(() => {});
  }

  const items = accounts.map((account) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.setAttribute('role', 'menuitemradio');
    item.textContent = account.email;
    item.addEventListener('click', () => select(account));
    return { account, item };
  });
  menu.replaceChildren(...items.map(({ item }) => item));

  function renderChecked() {
    for (const { account, item } of items)
      item.setAttribute('aria-checked', String(account.email === current?.email));
  }

  function setOpen(open: boolean) {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) (items.find(({ account }) => account === current) ?? items[0])?.item.focus();
  }

  function select(account: Account) {
    setOpen(false);
    button.focus();
    if (account === current) return;
    current = account;
    renderChecked();
    // RF-09, RN-03
    void setLastAccount(account.email).catch(() => {});
    section.hidden = false;
    showStatus('');
    for (const listener of listeners) listener(account);
  }

  renderChecked();
  // RF-02, RF-03: el botón solo tiene sentido con más de una cuenta.
  button.hidden = accounts.length < 2;
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  // SUP-06: se cierra al pulsar fuera de él (o con Escape).
  document.addEventListener('click', (event) => {
    const target = event.target as Node;
    if (!menu.hidden && !menu.contains(target) && !button.contains(target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menu.hidden) return;
    setOpen(false);
    button.focus();
  });

  return {
    get current() {
      return current;
    },
    watch(listener) {
      listeners.push(listener);
      if (current) listener(current);
    },
    setBusy(busy) {
      button.disabled = busy;
      if (busy) setOpen(false);
    },
    signedOut() {
      current = undefined;
      setOpen(false);
      button.hidden = true;
      section.hidden = true;
      showStatus(NOT_LOGGED_IN, 'info');
    },
  };
}
