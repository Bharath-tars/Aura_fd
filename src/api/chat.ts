import client from './client'
import type { ChatSession, ChatMessage } from '@/types'
import { useAuthStore } from '@/store/authStore'

export const chatApi = {
  listSessions: () => client.get<{ data: ChatSession[] }>('/chat/sessions'),

  createSession: (title = 'New conversation') =>
    client.post<ChatSession>('/chat/sessions', { title }),

  getMessages: (sessionId: string) =>
    client.get<{ data: ChatMessage[] }>(`/chat/sessions/${sessionId}/messages`),

  deleteSession: (sessionId: string) =>
    client.delete(`/chat/sessions/${sessionId}`),

  streamMessage: (sessionId: string, content: string) => {
    const token = useAuthStore.getState().token
    const url = `/api/v1/chat/sessions/${sessionId}/message`

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    })
  },
}
