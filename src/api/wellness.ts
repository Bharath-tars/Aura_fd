import client from './client'
import type { WellnessPlan } from '@/types'

export const wellnessApi = {
  listPlans: () => client.get<{ data: WellnessPlan[] }>('/wellness/plans'),

  createPlan: (data: object) => client.post<WellnessPlan>('/wellness/plans', data),

  updatePlan: (id: string, data: object) => client.put<WellnessPlan>(`/wellness/plans/${id}`, data),

  deletePlan: (id: string) => client.delete(`/wellness/plans/${id}`),

  generatePlan: (focus?: string) =>
    client.post<WellnessPlan>('/wellness/generate', { focus }),
}
