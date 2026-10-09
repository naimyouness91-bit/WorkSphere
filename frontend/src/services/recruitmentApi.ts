import { api } from './api'
import type {
  Candidate,
  CandidateStatus,
  JobPosting,
  OnboardingTask,
  RecruitmentOverview,
} from '../types/recruitment'

export const recruitmentApi = {
  overview: () => api.get<{ data: RecruitmentOverview }>('/recruitment/overview'),

  jobPostings: (params?: { department?: string; status?: string }) =>
    api.get<{ data: JobPosting[] }>('/recruitment/job-postings', { params }),

  addJobPosting: (payload: {
    title: string
    description: string
    requirements?: string
    department: string
    location?: string
    status?: string
  }) => api.post<{ data: JobPosting; message: string }>('/recruitment/job-postings', payload),

  candidates: (params?: { job_id?: number; status?: string }) =>
    api.get<{ data: Candidate[] }>('/recruitment/candidates', { params }),

  applyCandidate: (form: FormData) =>
    api.post<{ data: Candidate; message: string }>('/recruitment/candidates', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCandidateStatus: (id: number, status: CandidateStatus) =>
    api.patch<{ data: Candidate; message: string }>(`/recruitment/candidates/${id}/status`, {
      status,
    }),

  exportCandidates: (jobId?: number) =>
    api.get<{ data: Array<Record<string, unknown>> }>('/recruitment/candidates/export', {
      params: jobId ? { job_id: jobId } : undefined,
    }),

  previewResume: (id: number) =>
    api.get<Blob>(`/recruitment/candidates/${id}/resume/preview`, { responseType: 'blob' }),

  downloadResume: (id: number) =>
    api.get<Blob>(`/recruitment/candidates/${id}/resume/download`, { responseType: 'blob' }),

  onboardingTasks: (employeeId?: number) =>
    api.get<{ data: OnboardingTask[] }>('/recruitment/onboarding-tasks', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  completeOnboardingTask: (id: number) =>
    api.patch<{ data: OnboardingTask; message: string }>(
      `/recruitment/onboarding-tasks/${id}/complete`,
    ),
}
