import { describe, expect, it } from 'vitest';
import { classifyTab } from './page';

describe('classifyTab', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', { kind: 'video', videoId: 'dQw4w9WgXcQ' }],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', { kind: 'video', videoId: 'dQw4w9WgXcQ' }],
    ['https://www.youtube.com/shorts/abc_DEF-123', { kind: 'video', videoId: 'abc_DEF-123' }],
    // Un vídeo que se reproduce dentro de una lista cuenta como vídeo (RF-10).
    [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&index=2',
      { kind: 'video', videoId: 'dQw4w9WgXcQ' },
    ],
    ['https://www.youtube.com/playlist?list=PL123', { kind: 'playlist', listId: 'PL123' }],
    ['https://notebook.google.com/notebook/abc-123', { kind: 'notebook' }],
    ['https://notebooklm.google.com/notebook/abc-123', { kind: 'notebook' }],
  ])('%s', (url, expected) => {
    expect(classifyTab(url)).toEqual(expected);
  });

  it.each([
    undefined,
    '',
    'chrome://extensions',
    'https://www.youtube.com/',
    'https://www.youtube.com/results?search_query=fisica',
    'https://www.youtube.com/playlist',
    'https://notebook.google.com/',
    'https://example.com/watch?v=dQw4w9WgXcQ',
  ])('no ofrece acciones en %s', (url) => {
    expect(classifyTab(url)).toEqual({ kind: 'none' });
  });
});
