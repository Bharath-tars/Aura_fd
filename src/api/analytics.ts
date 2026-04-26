import client from './client'
import type { Dashboard } from '@/types'

export const analyticsApi = {
  dashboard: () => client.get<Dashboard>('/analytics/dashboard'),
  weekly: () => client.get('/analytics/weekly'),
}

export const streakApi = {
  get: () => client.get('/streak/').then((r) => r.data.data),
}
