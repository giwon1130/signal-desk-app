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

export type TechnicalSignal = {
  rsi: number | null
  rsiState: string | null
  ma5: number | null
  ma20: number | null
  maSignal: string | null
  week52High: number | null
  week52Low: number | null
  week52State: string | null
}

export type WatchItem = {
  id: string
  market: string
  ticker: string
  name: string
  price: number
  changeRate: number
  sector: string
  stance: string
  note: string
  source: string
  technical?: TechnicalSignal | null
  volume?: number
  volumeRatio?: number | null
  alertBelow?: number | null
  alertAbove?: number | null
  volumeAlert?: boolean
}

export type HoldingPosition = {
  id: string
  market: string
  ticker: string
  name: string
  buyPrice: number
  currentPrice: number
  quantity: number
  profitAmount: number
  evaluationAmount: number
  profitRate: number
  source: string
  targetPrice?: number | null
  stopLossPrice?: number | null
}

export type PortfolioSummary = {
  totalCost: number
  totalValue: number
  totalProfit: number
  totalProfitRate: number
  positions: HoldingPosition[]
}

export type MarketSectionsData = {
  generatedAt: string
  koreaMarket: MarketSection
  usMarket: MarketSection
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

export type BriefingSlot = 'PRE_MARKET' | 'INTRADAY' | 'POST_MARKET' | 'WEEKEND' | 'HOLIDAY'

export type BriefingContext = {
  holdingPnlLabel: string | null
  holdingPnlRate: number | null
  watchlistAlertCount: number
  marketMood: string
  keyEvent: string | null
}

export type BriefingAction = {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  detail: string
  ticker: string | null
  market: string | null
}

export type DailyBriefing = {
  headline: string
  preMarket: string[]
  afterMarket: string[]
  narrative: string
  slot: BriefingSlot
  context: BriefingContext | null
  actionItems: BriefingAction[]
}

export type AiRecommendationData = {
  generatedDate: string
  summary: string
  executionLogs: RecommendationExecutionLog[]
  metrics?: RecommendationMetrics | null
}

export type WatchlistResponse = {
  generatedAt: string
  watchlist: WatchItem[]
}

export type PortfolioResponse = {
  generatedAt: string
  portfolio: PortfolioSummary
}

export type ApiResponse<T> = {
  success: boolean
  data: T
}

export type TopMover = {
  market: 'KR' | 'US' | string
  ticker: string
  name: string
  price: number
  changeRate: number
}

export type DisclosureItem = {
  rceptNo: string
  corpName: string
  stockCode: string
  reportNm: string
  rceptDt: string
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

export type MediaSummaryItem = {
  id: string
  channelTitle: string
  videoTitle: string
  videoUrl: string
  publishedAt: string
  summary: string
  flowAnalysis: string
  keyTickers: string[]
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  hasTranscript: boolean
  source: 'YOUTUBE' | 'NEWS_DIGEST' | 'MORNING_BRIEF' | 'EVENING_BRIEF'
}

export type HealthResponse = {
  status: string
  application: string
  storeMode: string
}

export type StockSearchResult = {
  ticker: string
  name: string
  market: string
  sector: string
  price: number
  changeRate: number
  stance: string
}

export type SelectedStockSnapshot = {
  base: StockSearchResult
  watchItem?: WatchItem
  portfolioPosition?: HoldingPosition
  latestAiLog?: RecommendationExecutionLog
}

export type FavoriteDraft = {
  stance: string
  note: string
}

export type TabKey = 'today' | 'home' | 'market' | 'stocks' | 'ai'
export type LogFilter = 'ALL' | 'RECOMMEND' | 'RESULT'
export type MarketKey = 'KR' | 'US'
export type PeriodKey = 'D' | 'W' | 'M'
export type StockMarketFilter = 'ALL' | 'KR' | 'US'
