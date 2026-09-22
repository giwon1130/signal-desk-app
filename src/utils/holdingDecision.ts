import type { HoldingPosition } from '../types/workspace'

export type HoldingDecision = {
  code: 'STOP_REVIEW' | 'TARGET_REVIEW' | 'CONFIGURE' | 'HOLD' | 'INVALID'
  label: string
  detail: string
  priority: number
}

/** 사용자 지정 가격만 비교한다. 손익률만으로 임의의 매도 기준을 만들지 않는다. */
export function assessHolding(position: HoldingPosition): HoldingDecision {
  const { currentPrice, buyPrice, targetPrice, stopLossPrice } = position
  const valid = (value: number) => Number.isFinite(value) && value > 0
  if (!valid(currentPrice) || !valid(buyPrice)) {
    return { code: 'INVALID', label: '가격 확인 필요', detail: '현재가와 매수가를 먼저 확인해 주세요.', priority: 2 }
  }
  if ((targetPrice != null && !valid(targetPrice)) || (stopLossPrice != null && !valid(stopLossPrice)) ||
      (targetPrice != null && stopLossPrice != null && stopLossPrice >= targetPrice)) {
    return { code: 'INVALID', label: '기준 가격 확인', detail: '목표가가 손절가보다 높게 설정됐는지 확인해 주세요.', priority: 2 }
  }
  if (stopLossPrice != null && currentPrice <= stopLossPrice) {
    return { code: 'STOP_REVIEW', label: '손절 기준 도달', detail: '설정한 손절가에 도달했습니다. 최신 호가와 대응 기준을 확인해 주세요.', priority: 0 }
  }
  if (targetPrice != null && currentPrice >= targetPrice) {
    return { code: 'TARGET_REVIEW', label: '목표가 도달', detail: '설정한 목표가에 도달했습니다. 최신 시세와 미리 정한 대응 계획을 확인해 주세요.', priority: 1 }
  }
  if (targetPrice == null || stopLossPrice == null) {
    return { code: 'CONFIGURE', label: '대응 기준 설정', detail: '목표가와 손절가를 모두 정해두면 도달 여부를 안내합니다.', priority: 3 }
  }
  return { code: 'HOLD', label: '기준 안에서 관찰', detail: '아직 설정한 목표가·손절가에 도달하지 않았습니다.', priority: 4 }
}
