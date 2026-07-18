/** 변동성·실적 등 특정 이벤트에만 노출되는 운영 검수형 시장 라운드. */
export type MarketRoundContent = {
  id: string
  kind: string
  sourceName: string
  expertName?: string | null
  title: string
  url: string
  publishedAt?: string | null
  whyRecommended: string
  label: string
  official: boolean
}

export type MarketRound = {
  id: string
  title: string
  summary: string
  riskLevel: 'WATCH' | 'CAUTION' | 'HIGH' | string
  marketScope: 'KR' | 'US' | 'BOTH' | 'GLOBAL' | string
  checkpoints: string[]
  startsAt: string
  endsAt: string
  contents: MarketRoundContent[]
}
