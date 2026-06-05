/** 시즈널리티 백테스트 — 백엔드 SeasonalityReport 대응. */

export type SeasonalityTier = 'STRONG' | 'WEAK' | 'NOISE'

export type MonthStat = {
  month: number // 1~12
  meanPct: number
  medianPct: number
  winRatePct: number
  sampleYears: number
  worstYearPct: number
  bestYearPct: number
  netAfterCostPct: number
  tier: SeasonalityTier
}

export type DayStat = { weekday: number; label: string; meanPct: number; winRatePct: number; n: number }

export type WeekendTrade = { meanPct: number; winRatePct: number; n: number; netAfterCostPct: number }

export type SeasonalityRuleCard = {
  kind: 'BUY_MONTH' | 'AVOID_MONTH'
  title: string
  detail: string
  month: number | null
  tier: SeasonalityTier
}

export type SeasonalityReport = {
  market: string
  ticker: string
  name: string
  history: { years: number; from: string; to: string; bars: number; source: string }
  costAssumptionPct: number
  monthly: MonthStat[]
  weekday: DayStat[]
  weekendTrade: WeekendTrade | null
  highlights: SeasonalityRuleCard[]
  caveats: string[]
}

/** 섹터 로테이션. */
export type SectorMonth = { month: number; meanPct: number; winRatePct: number; tier: SeasonalityTier }
export type SectorSeasonality = { key: string; name: string; etf: string; historyYears: number; monthly: SectorMonth[] }
export type SectorRotationReport = { market: string; asOf: string; currentMonth: number; sectors: SectorSeasonality[] }

/** 저장한 시즌 규칙(알고리즘 포트폴리오). */
export type SeasonalityRule = {
  id: string
  market: string
  ticker: string
  name: string
  kind: 'BUY_MONTH' | 'AVOID_MONTH'
  month: number
  meanPct: number | null
  winRatePct: number | null
  sampleYears: number | null
  createdAt: string
}
