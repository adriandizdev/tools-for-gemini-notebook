import { describe, expect, it } from 'vitest';
import { type Conversation, filterConversation } from './conversation';

const conversation: Conversation = {
  title: 'Estadistica',
  url: 'https://notebook.google.com/notebook/abc',
  messages: [
    { role: 'user', html: 'Pregunta 1' },
    { role: 'assistant', html: 'Respuesta 1' },
    { role: 'user', html: 'Pregunta 2' },
    { role: 'assistant', html: 'Respuesta 2' },
  ],
};

describe('filterConversation', () => {
  it('conserva todos los mensajes si se incluyen las preguntas', () => {
    expect(filterConversation(conversation, { includeUserMessages: true })).toEqual(conversation);
  });

  it('deja solo las respuestas, en orden, si se excluyen las preguntas', () => {
    const filtered = filterConversation(conversation, { includeUserMessages: false });
    expect(filtered.messages.map((m) => m.html)).toEqual(['Respuesta 1', 'Respuesta 2']);
    expect(filtered.title).toBe(conversation.title);
    expect(filtered.url).toBe(conversation.url);
  });

  it('no modifica la conversación original', () => {
    filterConversation(conversation, { includeUserMessages: false });
    expect(conversation.messages).toHaveLength(4);
  });
});
