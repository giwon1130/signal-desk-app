/**
 * 시스템/공통 타입 — API envelope, 공시, 운세, 알림 이력, UI 키.
 */

export type ApiResponse<T> = {
  success: boolean
  data: T
}

export type HealthResponse = {
  status: string
  application: string
  storeMode: string
}

export type DisclosureItem = {
  rceptNo: string
  corpName: string
  stockCode: string
  reportNm: string
  rceptDt: string
}

export type DailyFortune = {
  date: string              // YYYY-MM-DD
  overallScore: number      // 0~100
  overallLabel: string      // 대길 / 길 / 평 / 주의 / 흉
  overallTone: 'good' | 'neutral' | 'bad'
  headline: string
  message: string
  wealthScore: number
  tradeScore: number
  patienceScore: number
  luckyHour: string
  luckyColor: string
  luckyNumber: number
  luckyTheme: string
  caution: string
  mantra: string
  disclaimer: string
}

export type AlertHistoryItem = {
  market: string
  ticker: string
  name: string
  direction: 'UP' | 'DOWN'
  changeRate: number
  alertDate: string
  sentAt: string
}

export type TabKey = 'today' | 'home' | 'market' | 'stocks' | 'ai'
export type LogFilter = 'ALL' | 'RECOMMEND' | 'RESULT'
export type MarketKey = 'KR' | 'US'
export type PeriodKey = 'D' | 'W' | 'M'
export type StockMarketFilter = 'ALL' | 'KR' | 'US'
