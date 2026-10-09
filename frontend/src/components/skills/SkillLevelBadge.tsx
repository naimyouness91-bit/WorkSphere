import { useTranslation } from 'react-i18next'
import type { SkillLevel } from '../../types/skill'
import { SKILL_LEVEL_COLORS } from '../../utils/skillLevel'

interface Props {
  level: SkillLevel
}

export default function SkillLevelBadge({ level }: Props) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${SKILL_LEVEL_COLORS[level]}`}
    >
      {t(`skills.levels.${level}`)}
    </span>
  )
}
