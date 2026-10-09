import { api } from './api'
import type {
  GamificationBadge,
  GamificationOverview,
  GamificationPoints,
  LeaderboardDepartment,
  LeaderboardEmployee,
} from '../types/gamification'

export const gamificationApi = {
  overview: () => api.get<{ data: GamificationOverview }>('/gamification/overview'),
  badges: () => api.get<{ data: GamificationBadge[] }>('/gamification/badges'),
  points: () => api.get<{ data: GamificationPoints }>('/gamification/points'),
  leaderboard: (scope: 'company' | 'department' = 'company') =>
    api.get<{
      data: {
        employees: LeaderboardEmployee[]
        departments: LeaderboardDepartment[]
        user_rank: number | null
      }
    }>('/gamification/leaderboard', { params: { scope } }),
}
