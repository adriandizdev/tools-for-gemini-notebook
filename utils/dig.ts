/**
 * Recorre `value` siguiendo `path` (claves de objeto o índices de array) y devuelve lo que haya
 * al final, o `undefined` si falta algún paso. Para leer JSON sin esquema (YouTube, NotebookLM)
 * sin pasar por `any`: el resultado hay que comprobarlo con `typeof`/`Array.isArray`.
 */
export function dig(value: unknown, ...path: (string | number)[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}
