import type { AiPick, TradePlan } from '../types/ai'
import {
  buildTradePlanShareText,
  formatTradePlanPrice,
  isTradePlanExpired,
  tradePlanRiskLabel,
} from '../utils/tradePlan'

const plan: TradePlan = {
  proposalId: 'proposal-1',
  side: 'BUY',
  orderType: 'LIMIT',
  currency: 'KRW',
  referencePrice: 200000,
  entryLimitPrice: 197000,
  stopLossPrice: 193060,
  takeProfitPrice: 220640,
  riskLevel: 'HIGH',
  maxPositionPercent: 3,
  expiresAt: '2026-08-01T01:30:00Z',
  guardrails: ['진입 상한을 넘으면 추격 매수하지 않기'],
  executable: false,
}

const pick: AiPick = {
  market: 'KR', ticker: '000660', name: 'SK하이닉스',
  reason: '수급과 모멘텀을 함께 확인했습니다.',
  expectedReturnRate: 10, confidence: 80, riskNote: '변동성 주의', tradePlan: plan,
}

describe('tradePlan', () => {
  it('가격을 통화별로 표시한다', () => {
    expect(formatTradePlanPrice(200000, 'KRW')).toBe('200,000원')
    expect(formatTradePlanPrice(123.4, 'USD')).toBe('$123.40')
  })

  it('공유 문구에 실행 오해를 막는 정보가 포함된다', () => {
    const text = buildTradePlanShareText(pick)
    expect(text).toContain('SK하이닉스 (KR 000660)')
    expect(text).toContain('진입 상한 197,000원')
    expect(text).toContain('종목 비중 최대 3%')
    expect(text).toContain('실제 주문이 아닌 검토용 계획')
  })

  it('만료와 위험도 라벨을 판정한다', () => {
    expect(isTradePlanExpired(plan, new Date('2026-08-01T01:29:59Z'))).toBe(false)
    expect(isTradePlanExpired(plan, new Date('2026-08-01T01:30:00Z'))).toBe(true)
    expect(tradePlanRiskLabel('HIGH')).toBe('높음')
  })
})
