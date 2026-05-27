/**
 * 시장 데이터 타입 — 지수·세션·차트·뉴스·합성 위험도·휴장일·이벤트.
 */
import type { DailyBriefing } from './briefing'

export type SummaryMetric = {
  label: string
  score: number
  state: string
  note: string
}

export type AlternativeSignal = {
  label: string
  score: number
  state: string
  note: string
  highlights: string[]
  source: string
  url: string
  experimental: boolean
  description?: string
  methodology?: string
  personalImpact?: string | null
}

export type RiskComponent = {
  label: string
  score: number      // 0~100 sub-score
  weight: number     // 합성 가중치 (0.5 / 0.3 / 0.2)
  state: string
  detail: string
}

export type CompositeRiskSignal = {
  score: number      // 1~10 위험도
  score100: number   // 0~100 내부 정규화 점수
  level: string      // 안정 / 관망 / 주의 / 경계 / 고위험
  headline: string
  components: RiskComponent[]
  description: string
  methodology: string
  asOf: string
  personalImpact?: string | null
}

export type TradingDayStatus = {
  krOpen: boolean
  usOpen: boolean
  isWeekend: boolean
  isHoliday: boolean
  headline: string
  nextTradingDay: string
  advice: string
}

export type WatchAlert = {
  severity: 'high' | 'medium' | 'low'
  category: string
  market: string
  ticker: string
  name: string
  title: string
  note: string
  score: number
  tags: string[]
}

export type MarketSessionStatus = {
  market: string
  label: string
  phase: string
  status: string
  isOpen: boolean
  localTime: string
  note: string
}

export type ChartPoint = {
  label: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type ChartStats = {
  latest: number
  high: number
  low: number
  changeRate: number
  range: number
  averageVolume: number
}

export type ChartPeriodSnapshot = {
  key: string
  label: string
  points: ChartPoint[]
  stats: ChartStats
}

export type IndexMetric = {
  label: string
  value: number
  changeRate: number
  periods: ChartPeriodSnapshot[]
}

export type MarketSection = {
  market: string
  title: string
  indices: IndexMetric[]
}

export type MarketSectionsData = {
  generatedAt: string
  koreaMarket: MarketSection
  usMarket: MarketSection
}

export type NewsHighlight = {
  title: string
  source: string
  url: string
  tone: string             // 긍정 / 중립 / 부정
  publishedAt?: string | null  // ISO-8601. 백엔드가 RSS pubDate 를 변환해서 내려줌. 없으면 표기 생략.
}

export type NewsSentiment = {
  market: string           // KR / US
  score: number            // 0~100, 50=중립
  label: string            // 긍정 / 중립 / 부정
  rationale: string
  positiveCount: number
  negativeCount: number
  neutralCount: number
  highlights: NewsHighlight[]
}

export type MarketSummaryData = {
  generatedAt: string
  marketStatus: string
  summary: string
  marketSummary: SummaryMetric[]
  alternativeSignals: AlternativeSignal[]
  compositeRisk?: CompositeRiskSignal
  watchAlerts: WatchAlert[]
  marketSessions: MarketSessionStatus[]
  newsSentiments?: NewsSentiment[]
  tradingDayStatus?: TradingDayStatus
  briefing?: DailyBriefing
}

export type TopMover = {
  market: 'KR' | 'US' | string
  ticker: string
  name: string
  price: number
  changeRate: number
}

export type TopMoversBlock = {
  gainers: TopMover[]
  losers: TopMover[]
}

export type TopMoversResponse = {
  generatedAt: string
  kospi: TopMoversBlock
  kosdaq: TopMoversBlock
  us?: TopMoversBlock
}

export type EventCategory = 'FOMC' | 'EARNINGS' | 'POLICY' | 'ECONOMIC_DATA' | 'HOLIDAY' | 'OTHER'
export type EventImportance = 'HIGH' | 'MEDIUM' | 'LOW'

export type MarketEvent = {
  id: string
  date: string         // ISO yyyy-MM-dd
  time: string | null  // null = 종일
  market: 'KR' | 'US' | 'GLOBAL'
  category: EventCategory
  title: string
  description: string | null
  importance: EventImportance
  tickers: string[]
}
