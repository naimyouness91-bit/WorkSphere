export interface GamificationBadge {
  id: number
  code: string
  title: string
  description: string
  icon: string
  color: string
  points_reward: number
  criteria_key: string
  criteria_value: number
  earned: boolean
  earned_at: string | null
}

export interface PointHistoryItem {
  id: number
  points: number
  reason: string
  created_at: string | null
}

export interface GamificationPoints {
  total_points: number
  level: number
  next_level_at: number
  progress_percent: number
  history: PointHistoryItem[]
}

export interface LeaderboardEmployee {
  rank: number
  user_id: number
  name: string
  department: string
  total_points: number
}

export interface LeaderboardDepartment {
  rank: number
  department: string
  total_points: number
  member_count: number
}

export interface WeeklyChallenge {
  id: number
  title: string
  description: string
  target_count: number
  progress: number
  points_reward: number
  department: string | null
  completed: boolean
  week_end: string
}

export interface GamificationOverview {
  stats: {
    total_points: number
    level: number
    badges_earned: number
    badges_total: number
    company_rank: number | null
  }
  points: GamificationPoints
  badges: GamificationBadge[]
  challenges: WeeklyChallenge[]
  leaderboard_preview: LeaderboardEmployee[]
}

export interface GamificationStats {
  total_points: number
  level: number
  badges_earned: number
  company_rank: number | null
}
