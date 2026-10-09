import type { SkillLevel } from '../types/skill'

export const SKILL_LEVEL_ORDER: SkillLevel[] = ['beginner', 'intermediate', 'advanced']

export const SKILL_LEVEL_SCORE: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
}

export const SKILL_LEVEL_PERCENT: Record<SkillLevel, number> = {
  beginner: 33,
  intermediate: 66,
  advanced: 100,
}

export const SKILL_LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  advanced: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
}

export const SKILL_BAR_COLORS: Record<SkillLevel, string> = {
  beginner: 'bg-sky-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-emerald-500',
}
