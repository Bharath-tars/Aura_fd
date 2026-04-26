import client from './client'
import type { MoodEntry, MoodAnalytics, PaginatedResponse } from '@/types'

export const moodApi = {
  log: (data: { score: number; energy_level?: number; emotions?: string[]; factors?: string[]; notes?: string }) =>
    client.post<MoodEntry>('/mood/', data),

  list: (skip = 0, limit = 20) =>
    client.get<PaginatedResponse<MoodEntry>>('/mood/', { params: { skip, limit } }),

  get: (id: string) => client.get<MoodEntry>(`/mood/${id}`),

  update: (id: string, data: { score?: number; energy_level?: number; emotions?: string[]; factors?: string[]; notes?: string }) =>
    client.patch<MoodEntry>(`/mood/${id}`, data),

  delete: (id: string) => client.delete(`/mood/${id}`),

  analytics: () => client.get<MoodAnalytics>('/mood/analytics'),
}
