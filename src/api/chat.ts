import client from './client'
import type { ChatSession, ChatMessage } from '@/types'
import { useAuthStore } from '@/store/authStore'

type StreamEvent = {
  type: string
  content?: string
  level?: number
  resources?: string[]
}

export const chatApi = {
  listSessions: () => client.get<{ data: ChatSession[] }>('/chat/sessions'),

  createSession: (title = 'New conversation') =>
    client.post<ChatSession>('/chat/sessions', { title }),

  getMessages: (sessionId: string) =>
    client.get<{ data: ChatMessage[] }>(`/chat/sessions/${sessionId}/messages`),

  deleteSession: (sessionId: string) =>
    client.delete(`/chat/sessions/${sessionId}`),

  async *streamMessage(
    _token: string,
    sessionId: string,
    content: string,
    signal?: AbortSignal
  ): AsyncGenerator<StreamEvent> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
    const url = `${baseUrl}/chat/sessions/${sessionId}/message`
    const token = useAuthStore.getState().token

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
      signal,
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') return
          try {
            yield JSON.parse(data) as StreamEvent
          } catch { /* skip malformed lines */ }
        }
      }
    }
  },
}

export const getSessions = (_token: string) =>
  chatApi.listSessions().then(r => r.data.data)

export const getMessages = (_token: string, sessionId: string) =>
  chatApi.getMessages(sessionId).then(r => r.data.data)

export const createSession = (_token: string, title = 'New conversation') =>
  chatApi.createSession(title).then(r => r.data)

export const deleteSession = (_token: string, id: string) =>
  chatApi.deleteSession(id)
