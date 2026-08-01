/**
 * AI 타입 — Gemini 시황·픽·숨은 시그널·추천 실행 로그.
 */

export type MarketInsightData = {
  headline: string
  summary: string
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  keyPoints: string[]
}

export type AiPick = {
  market: string
  ticker: string
  name: string
  reason: string
  expectedReturnRate: number | null
  confidence: number
  riskNote: string
  changeRate?: number | null   // 후보의 당일 등락률 (근거 노출)
  flowTag?: string | null       // 수급 태그 (외인/기관 순매수)
  /** 실제 주문이 아닌 검토용 계획. 가격 데이터가 없으면 null. */
  tradePlan?: TradePlan | null
}

export type TradePlanRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type TradePlan = {
  proposalId: string
  side: 'BUY'
  orderType: 'LIMIT'
  currency: 'KRW' | 'USD'
  referencePrice: number
  entryLimitPrice: number
  stopLossPrice: number
  takeProfitPrice: number
  riskLevel: TradePlanRiskLevel
  maxPositionPercent: number
  expiresAt: string
  guardrails: string[]
  /** 공개 앱에서는 항상 false. 실제 실행은 개인용 trader가 별도 검증한다. */
  executable: boolean
}

export type AiPicksData = {
  generatedAt: string
  summary: string
  picks: AiPick[]
}

export type SignalTrigger = {
  type: 'DISCLOSURE' | 'FOREIGN_BUY' | 'INSTITUTION_BUY' | 'SURGE' | 'PLUNGE' | string
  label: string
  detail: string | null
}

export type HiddenSignal = {
  market: string
  ticker: string
  name: string
  triggers: SignalTrigger[]
}

export type HiddenSignalsData = {
  generatedAt: string
  signals: HiddenSignal[]
}

export type UserPickStatus = 'HELD' | 'WATCHED' | 'NEW'

export type RecommendationExecutionLog = {
  date: string
  market: string
  ticker: string
  name: string
  stage: string
  status: string
  rationale: string
  confidence: number | null
  expectedReturnRate: number | null
  realizedReturnRate: number | null
  source: string
  userStatus?: UserPickStatus
  newsUrl?: string | null
  newsTitle?: string | null
  // 진입 가이드 — 백엔드가 라이브 시세 + expectedReturnRate 로 산출. 시세 없으면 null.
  entryPrice?: number | null
  stopLoss?: number | null
  takeProfit?: number | null
}

export type RecommendationMetrics = {
  windowDays: number
  totalCount: number
  successCount: number
  hitRate: number            // 0.0~1.0
  averageReturnRate: number
  bestReturnRate: number
  worstReturnRate: number
}

export type AiRecommendationData = {
  generatedDate: string
  summary: string
  executionLogs: RecommendationExecutionLog[]
  metrics?: RecommendationMetrics | null
}
