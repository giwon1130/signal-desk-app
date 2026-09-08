import { assessHolding } from '../utils/holdingDecision'
import { portfolioTotals } from '../utils/portfolioTotals'
import type { HoldingPosition } from '../types/workspace'

const position: HoldingPosition = {
  id: 'one', market: 'KR', ticker: '005930', name: '삼성전자', buyPrice: 100,
  currentPrice: 104, quantity: 2, profitAmount: 8, evaluationAmount: 208, profitRate: 4, source: 'TEST',
}

describe('사용자 가격 기준 점검', () => {
  it('손익률 3%만으로 매도를 안내하지 않는다', () => {
    expect(assessHolding(position).code).toBe('CONFIGURE')
    expect(assessHolding({ ...position, profitRate: -40 }).code).toBe('CONFIGURE')
  })
  it('목표가와 손절가의 정확한 경계에서만 검토한다', () => {
    const configured = { ...position, targetPrice: 110, stopLossPrice: 95 }
    expect(assessHolding(configured).code).toBe('HOLD')
    expect(assessHolding({ ...configured, currentPrice: 95 }).code).toBe('STOP_REVIEW')
    expect(assessHolding({ ...configured, currentPrice: 95.01 }).code).toBe('HOLD')
    expect(assessHolding({ ...configured, currentPrice: 110 }).code).toBe('TARGET_REVIEW')
    expect(assessHolding({ ...configured, currentPrice: 109.99 }).code).toBe('HOLD')
  })
  it('누락·역전·비정상 설정을 보유 판단으로 오인하지 않는다', () => {
    expect(assessHolding({ ...position, targetPrice: 95, stopLossPrice: 110 }).code).toBe('INVALID')
    expect(assessHolding({ ...position, currentPrice: NaN }).code).toBe('INVALID')
    expect(assessHolding({ ...position, targetPrice: Infinity }).code).toBe('INVALID')
    expect(assessHolding({ ...position, stopLossPrice: 0 }).code).toBe('INVALID')
    expect(assessHolding({ ...position, stopLossPrice: 95 }).code).toBe('CONFIGURE')
    expect(assessHolding({ ...position, stopLossPrice: 105 }).code).toBe('STOP_REVIEW')
  })
})

describe('포트폴리오 통화별 합계', () => {
  it('원화와 달러를 더하지 않고 현재 행 가격으로 계산한다', () => {
    const totals = portfolioTotals([position, { ...position, market: 'US', quantity: 1 }], () => 110)
    expect(totals).toEqual([
      { market: 'KR', value: 220, profit: 20, rate: 10, invalid: false },
      { market: 'US', value: 110, profit: 10, rate: 10, invalid: false },
    ])
  })
  it('손상된 시세를 0원으로 합산하지 않는다', () => {
    expect(portfolioTotals([position], () => NaN)[0].invalid).toBe(true)
    expect(portfolioTotals([position], () => Number.MAX_VALUE)[0].invalid).toBe(true)
    expect(portfolioTotals([], () => 100)).toEqual([])
  })
})
