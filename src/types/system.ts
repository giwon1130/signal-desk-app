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

/** 공시 중요도 — 보유 종목 주가 영향 기준. 백엔드 제목 분류기와 1:1. */
export type DisclosureImportance = 'HIGH' | 'MEDIUM' | 'LOW'

export type DisclosureItem = {
  rceptNo: string
  corpName: string
  stockCode: string
  reportNm: string
  rceptDt: string
  /** 주가영향 중요도. 구버전 API 호환 위해 optional — 없으면 MEDIUM 취급. */
  importance?: DisclosureImportance
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
  id: string
  market: string
  ticker: string
  name: string
  direction: 'UP' | 'DOWN' | 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_SPIKE'
  changeRate: number
  /** '왜 움직였나' 한 줄 사유 (급등락 알림에만, 없을 수 있음) */
  reason?: string | null
  alertDate: string
  sentAt: string
  /** 읽은 시각. null/없음 = 안 읽음 */
  readAt?: string | null
}

/**
 * v2 탭 구조 — 4탭 (v2.1 League 추가).
 * - 'today': 시장 무드 + 보유 모니터 + 공시 + 모닝 브리프
 * - 'stocks': 종목 탐색 + 보유 + 관심
 * - 'ai': AI 픽 + 숨은 시그널 + 마켓 인사이트
 * - 'league': 친구 모의투자 (Trading League) — v2.1 신규
 *
 * v1 의 'home', 'market' 는 v2 에서 제거 (today 로 흡수).
 */
export type TabKey = 'today' | 'stocks' | 'ai' | 'league' | 'reading'
export type LogFilter = 'ALL' | 'RECOMMEND' | 'RESULT'
export type MarketKey = 'KR' | 'US'
export type PeriodKey = 'D' | 'W' | 'M'
export type StockMarketFilter = 'ALL' | 'KR' | 'US'
