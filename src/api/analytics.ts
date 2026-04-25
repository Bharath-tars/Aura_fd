import client from './client'

export const analyticsApi = {
  dashboard: () => client.get('/analytics/dashboard').then((r) => r.data.data),
  weekly: () => client.get('/analytics/weekly').then((r) => r.data.data),
}

export const streakApi = {
  get: () => client.get('/streak/').then((r) => r.data.data),
}
