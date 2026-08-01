import type { AiPick, TradePlan, TradePlanRiskLevel } from '../types/ai'

export function formatTradePlanPrice(value: number, currency: TradePlan['currency']): string {
  if (!Number.isFinite(value)) return '—'
  if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

export function tradePlanRiskLabel(level: TradePlanRiskLevel): string {
  if (level === 'LOW') return '낮음'
  if (level === 'HIGH') return '높음'
  return '보통'
}

export function isTradePlanExpired(plan: TradePlan, now = new Date()): boolean {
  const expiresAt = new Date(plan.expiresAt)
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()
}

export function buildTradePlanShareText(pick: AiPick): string | null {
  const plan = pick.tradePlan
  if (!plan) return null
  const expiry = new Date(plan.expiresAt)
  const expiryLabel = Number.isNaN(expiry.getTime())
    ? '확인 필요'
    : expiry.toLocaleString('ko-KR', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
      })

  return [
    '[Signal Desk 매매 계획]',
    `${pick.name} (${pick.market} ${pick.ticker})`,
    `기준가 ${formatTradePlanPrice(plan.referencePrice, plan.currency)}`,
    `진입 상한 ${formatTradePlanPrice(plan.entryLimitPrice, plan.currency)}`,
    `손절 기준 ${formatTradePlanPrice(plan.stopLossPrice, plan.currency)}`,
    `목표가 ${formatTradePlanPrice(plan.takeProfitPrice, plan.currency)}`,
    `위험도 ${tradePlanRiskLabel(plan.riskLevel)} · 종목 비중 최대 ${plan.maxPositionPercent}%`,
    `유효 시각 ${expiryLabel}`,
    `근거: ${pick.reason || '확인 필요'}`,
    pick.riskNote ? `주의: ${pick.riskNote}` : null,
    '',
    '※ 실제 주문이 아닌 검토용 계획입니다. 주문 전 가격과 거래 가능 시간을 다시 확인하세요.',
  ].filter((line): line is string => line != null).join('\n')
}
