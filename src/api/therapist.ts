import client from './client'
import type { TherapistSession, TherapistMessage } from '@/types'
import { useAuthStore } from '@/store/authStore'

type StreamEvent = {
  type: string
  content?: string
  level?: number
  resources?: string[]
  message_id?: string
}

export const therapistApi = {
  listSessions: () => client.get<{ data: TherapistSession[] }>('/therapist/sessions'),

  createSession: () => client.post<TherapistSession>('/therapist/sessions', {}),

  renameSession: (id: string, title: string) =>
    client.patch<TherapistSession>(`/therapist/sessions/${id}`, { title }),

  deleteSession: (id: string) => client.delete(`/therapist/sessions/${id}`),

  getMessages: (sessionId: string) =>
    client.get<{ data: TherapistMessage[] }>(`/therapist/sessions/${sessionId}/messages`),

  async *streamMessage(
    sessionId: string,
    message: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamEvent> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
    const url = `${baseUrl}/therapist/sessions/${sessionId}/message`
    const token = useAuthStore.getState().token

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
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
