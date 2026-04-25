import client from './client'
import type { WellnessPlan, PlanTask, JournalListItem } from '@/types'

export const wellnessApi = {
  listPlans: () => client.get<{ data: WellnessPlan[] }>('/wellness/plans'),

  createPlan: (data: object) => client.post<WellnessPlan>('/wellness/plans', data),

  updatePlan: (id: string, data: object) => client.put<WellnessPlan>(`/wellness/plans/${id}`, data),

  deletePlan: (id: string) => client.delete(`/wellness/plans/${id}`),

  generatePlan: (focus?: string) =>
    client.post<WellnessPlan>('/wellness/generate', { focus }),

  listTasks: (planId: string) =>
    client.get<PlanTask[]>(`/wellness/plans/${planId}/tasks`),

  createTask: (planId: string, data: { title: string; notes?: string; sort_order?: number }) =>
    client.post<PlanTask>(`/wellness/plans/${planId}/tasks`, data),

  updateTask: (
    planId: string,
    taskId: string,
    data: { completed?: boolean; time_logged_min?: number; notes?: string; title?: string },
  ) => client.patch<PlanTask>(`/wellness/plans/${planId}/tasks/${taskId}`, data),

  deleteTask: (planId: string, taskId: string) =>
    client.delete(`/wellness/plans/${planId}/tasks/${taskId}`),

  listPlanJournals: (planId: string) =>
    client.get<JournalListItem[]>(`/wellness/plans/${planId}/journal`),
}
