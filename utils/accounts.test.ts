import { describe, expect, it } from 'vitest';
import { chooseAccount } from './accounts';

const ana = { email: 'ana@gmail.com', authuser: 0 };
const trabajo = { email: 'ana.trabajo@gmail.com', authuser: 1 };
const otra = { email: 'otra@gmail.com', authuser: 2 };

describe('chooseAccount (REQ-004)', () => {
  it('CB-01: sin cuentas con la sesión iniciada no hay cuenta activa (M-19)', () => {
    expect(chooseAccount([], 'ana@gmail.com')).toEqual({ kind: 'none' });
  });

  it('CA-02 (RF-11): con una sola cuenta, es la activa', () => {
    expect(chooseAccount([ana], undefined)).toEqual({ kind: 'active', account: ana });
  });

  it('CA-04 (RF-10): usa la última cuenta usada si sigue con la sesión iniciada', () => {
    expect(chooseAccount([ana, trabajo], 'ana.trabajo@gmail.com')).toEqual({
      kind: 'active',
      account: trabajo,
    });
  });

  it('SUP-01: sin última cuenta, la activa es la principal del navegador', () => {
    expect(chooseAccount([ana, trabajo], undefined)).toEqual({ kind: 'active', account: ana });
  });

  it('CA-11 (CB-03): si la última ya no está y hay varias, no hay cuenta activa (M-20)', () => {
    expect(chooseAccount([ana, otra], 'ana.trabajo@gmail.com')).toEqual({
      kind: 'unavailable',
      email: 'ana.trabajo@gmail.com',
    });
  });

  it('CA-12 (CB-07): si la última ya no está y solo queda una, esa es la activa sin M-20', () => {
    expect(chooseAccount([ana], 'ana.trabajo@gmail.com')).toEqual({
      kind: 'active',
      account: ana,
    });
  });
});
