import type { SkillLevel } from '../../types/skill'
import { SKILL_BAR_COLORS, SKILL_LEVEL_PERCENT } from '../../utils/skillLevel'

interface Props {
  level: SkillLevel
}

export default function SkillLevelBar({ level }: Props) {
  const percent = SKILL_LEVEL_PERCENT[level]
  return (
    <div className="h-2 w-full min-w-[80px] overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div
        className={`h-full rounded-full transition-all ${SKILL_BAR_COLORS[level]}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
