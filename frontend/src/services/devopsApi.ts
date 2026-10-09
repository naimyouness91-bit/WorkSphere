import { api } from './api'

export interface DevOpsMetrics {
  build_success_rate: number
  deployment_frequency: number
  error_rate: number
  total_deployments_30d: number
  active_staging_version: string | null
  active_production_version: string | null
}

export interface DeploymentRecord {
  id: number
  environment: string
  version: string
  status: string
  image_tag: string | null
  commit_sha: string | null
  triggered_by: string
  is_active: boolean
  notes: string | null
  deployed_by_name: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export const devopsApi = {
  deployments: (environment?: string) =>
    api.get<{ data: { deployments: DeploymentRecord[]; metrics: DevOpsMetrics } }>(
      '/devops/deployments',
      { params: environment ? { environment } : undefined },
    ),

  rollback: (deploymentId: number) =>
    api.post<{ message: string; data: { rolled_back: DeploymentRecord; restored_version: string } }>(
      `/devops/deployments/${deploymentId}/rollback`,
    ),
}
