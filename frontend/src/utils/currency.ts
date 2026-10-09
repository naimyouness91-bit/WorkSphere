export function formatMoney(
  amount: number,
  locale = 'en-US',
  currency = 'USD',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function computeNetSalary(
  base: number,
  bonuses: number,
  deductions: number,
): number {
  return Math.max(0, base + bonuses - deductions)
}
