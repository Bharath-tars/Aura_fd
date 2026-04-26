import client from './client'
import type { User } from '@/types'

export const authApi = {
  register: (data: { username: string; email: string; password: string; timezone?: string; notification_time?: string }) =>
    client.post<{ access_token: string; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    client.post<{ access_token: string; user: User }>('/auth/login', data),

  me: () => client.get<User>('/auth/me'),

  completeOnboarding: (notification_time: string) =>
    client.patch<User>('/auth/me/onboarding', { notification_time }),

  updateProfile: (data: { gender?: string; age?: number; timezone?: string; notification_time?: string }) =>
    client.patch<User>('/auth/profile', data),

  deleteAccount: () => client.delete('/auth/me'),
}
