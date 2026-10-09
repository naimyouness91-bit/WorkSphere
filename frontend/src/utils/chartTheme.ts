export function getChartTheme(isDark: boolean) {
  return {
    grid: isDark ? '#334155' : '#e2e8f0',
    axis: isDark ? '#94a3b8' : '#64748b',
    tooltip: {
      background: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '#475569' : '#e2e8f0',
      color: isDark ? '#f1f5f9' : '#0f172a',
    },
  }
}
