import client from './client'
import type { JournalEntry, JournalListItem, PaginatedResponse } from '@/types'

export const journalApi = {
  create: (data: { title: string; content: string; plan_id?: string }) =>
    client.post<JournalEntry>('/journal/', data),

  list: (skip = 0, limit = 20) =>
    client.get<PaginatedResponse<JournalListItem>>('/journal/', { params: { skip, limit } }),

  get: (id: string) => client.get<JournalEntry>(`/journal/${id}`),

  update: (id: string, data: { title?: string; content?: string }) =>
    client.put<JournalEntry>(`/journal/${id}`, data),

  delete: (id: string) => client.delete(`/journal/${id}`),

  analyze: (id: string) => client.post<JournalEntry>(`/journal/${id}/analyze`),
}
