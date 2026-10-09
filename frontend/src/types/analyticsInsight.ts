export type InsightCategory = 'turnover' | 'performance' | 'finance' | 'hr' | 'recommendation'

export interface AnalyticsInsight {
  id: number
  title: string
  description: string
  category: InsightCategory
  confidence_score: number
  meta?: Record<string, unknown> | null
  recommendation?: { action: string; priority: string } | null
  created_at: string
}

export interface AnalyticsKpis {
  reports_generated: number
  insights_available: number
  prediction_accuracy: number
}

export interface HeatmapRow {
  department: string
  performance: number
  attendance: number
  risk_score: number
}

export interface AnalyticsOverview {
  statistics: import('./report').ReportStatistics
  analytics_kpis: AnalyticsKpis
  heatmap: HeatmapRow[]
  insights_preview: AnalyticsInsight[]
}

export interface AnalyticsStats {
  reports_generated: number
  insights_available: number
  prediction_accuracy: number
}
