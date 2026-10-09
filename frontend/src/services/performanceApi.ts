import { api } from './api'
import type { AppUser } from '../types/userList'
import type {
  Feedback360,
  PerformanceGoal,
  PerformanceOverview,
  PerformanceReport,
  PerformanceReview,
  TrainingSuggestion,
} from '../types/performance'

export const performanceApi = {
  overview: (employeeId?: number) =>
    api.get<{ data: PerformanceOverview }>('/performance/overview', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  getGoals: (employeeId?: number) =>
    api.get<{ data: PerformanceGoal[] }>('/performance/goals', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  addGoal: (payload: {
    employee_id: number
    title: string
    description?: string
    target_date: string
    status?: string
    progress?: number
  }) => api.post<{ data: PerformanceGoal; message: string }>('/performance/goals', payload),

  getReviews: (employeeId?: number) =>
    api.get<{ data: PerformanceReview[] }>('/performance/reviews', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  addReview: (payload: {
    employee_id: number
    comments?: string
    rating: number
    review_date?: string
  }) => api.post<{ data: PerformanceReview; message: string }>('/performance/reviews', payload),

  getFeedback360: (employeeId?: number) =>
    api.get<{ data: Feedback360[] }>('/performance/feedback360', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  addFeedback360: (payload: {
    employee_id: number
    feedback_text: string
    rating: number
    feedback_date?: string
    is_anonymous?: boolean
  }) => api.post<{ data: Feedback360; message: string }>('/performance/feedback360', payload),

  report: (employeeId: number) =>
    api.get<{ data: PerformanceReport }>('/performance/report', {
      params: { employee_id: employeeId },
    }),

  trainingSuggestions: (employeeId?: number) =>
    api.get<{ data: TrainingSuggestion[] }>('/performance/training-suggestions', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  colleagues: () => api.get<{ data: AppUser[] }>('/performance/colleagues'),
}
