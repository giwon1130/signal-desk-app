import type { HoldingPosition } from '../types/workspace'

/** 환율 없는 원화·달러를 합산하지 않는다. 합계는 화면 행과 같은 시세를 사용한다. */
export function portfolioTotals(positions: HoldingPosition[], priceOf: (position: HoldingPosition) => number) {
  return (['KR', 'US'] as const).flatMap((market) => {
    const rows = positions.filter((position) => position.market === market)
    if (!rows.length) return []
    let cost = 0
    let value = 0
    let invalid = false
    for (const position of rows) {
      const price = priceOf(position)
      if (![price, position.buyPrice, position.quantity].every((number) => Number.isFinite(number) && number > 0)) {
        invalid = true
        continue
      }
      cost += position.buyPrice * position.quantity
      value += price * position.quantity
    }
    const profit = value - cost
    invalid ||= ![value, cost, profit].every(Number.isFinite)
    return [{ market, value, profit, rate: cost > 0 ? profit / cost * 100 : 0, invalid }]
  })
}
