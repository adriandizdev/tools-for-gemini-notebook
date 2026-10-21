import { describe, expect, it } from 'vitest';
import { dig } from './dig';

describe('dig', () => {
  const data = { a: { b: [10, { c: 'x' }] } };

  it('sigue claves e índices', () => {
    expect(dig(data, 'a', 'b', 1, 'c')).toBe('x');
    expect(dig(data, 'a', 'b', 0)).toBe(10);
  });

  it('devuelve el propio valor sin ruta', () => {
    expect(dig(data)).toBe(data);
  });

  it('devuelve undefined si falta un paso', () => {
    expect(dig(data, 'a', 'z', 'c')).toBeUndefined();
    expect(dig(data, 'a', 'b', 5)).toBeUndefined();
  });

  it('devuelve undefined al atravesar algo que no es un objeto', () => {
    expect(dig(data, 'a', 'b', 0, 'c')).toBeUndefined();
    expect(dig(null, 0)).toBeUndefined();
    expect(dig('texto', 'length')).toBeUndefined();
  });
});
