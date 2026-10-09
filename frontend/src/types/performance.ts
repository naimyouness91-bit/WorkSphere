export type GoalStatus = 'pending' | 'in_progress' | 'achieved' | 'cancelled'

export interface PerformanceGoal {
  id: number
  employee_id: number
  title: string
  description: string | null
  target_date: string
  status: GoalStatus
  progress: number
  creator?: { id: number; name: string }
  created_at?: string
  updated_at?: string
}

export interface PerformanceReview {
  id: number
  employee_id: number
  reviewer?: { id: number; name: string }
  comments: string | null
  rating: number
  review_date: string
  created_at?: string
}

export interface Feedback360 {
  id: number
  employee_id: number
  from_user?: { id: number; name: string } | null
  is_anonymous: boolean
  is_anonymous_display?: boolean
  feedback_text: string
  rating: number
  feedback_date: string
  created_at?: string
}

export interface PerformanceKpis {
  goals_achieved: number
  goals_total: number
  average_rating: number
  feedback_count: number
}

export interface PerformanceScore {
  score: number
  goals_component: number
  reviews_component: number
  feedback_component: number
  breakdown: {
    goals_total: number
    goals_achieved: number
    avg_review_rating: number
    avg_feedback_rating: number
  }
}

export interface GoalTrendPoint {
  month: string
  label: string
  total: number
  achieved: number
  completion_rate: number
}

export interface RatingBucket {
  rating: number
  count: number
}

export interface PerformanceAnalytics {
  goal_completion_trend: GoalTrendPoint[]
  rating_distribution: RatingBucket[]
}

export interface TrainingSuggestion {
  training_id: number | null
  title: string
  reason: string
  priority: string
}

export interface PerformanceOverview {
  employee_id: number
  performance_score: PerformanceScore
  kpis: PerformanceKpis
  goals: PerformanceGoal[]
  analytics: PerformanceAnalytics
  training_suggestions: TrainingSuggestion[]
  can_manage: boolean
}

export interface PerformanceReport {
  employee: { id: number; name: string; email: string }
  goals: PerformanceGoal[]
  reviews: PerformanceReview[]
  feedback: Feedback360[]
  score: PerformanceScore
  history: Array<{
    id: number
    action: string
    description: string
    occurred_at: string
  }>
}
