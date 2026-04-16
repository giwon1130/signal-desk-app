import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import Svg, { Line, Path, Rect } from 'react-native-svg'

type SummaryMetric = {
  label: string
  score: number
  state: string
  note: string
}

type AlternativeSignal = {
  label: string
  score: number
  state: string
  note: string
  highlights: string[]
  source: string
  url: string
  experimental: boolean
}

type WatchAlert = {
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

type MarketSessionStatus = {
  market: string
  label: string
  phase: string
  status: string
  isOpen: boolean
  localTime: string
  note: string
}

type ChartPoint = {
  label: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type ChartStats = {
  latest: number
  high: number
  low: number
  changeRate: number
  range: number
  averageVolume: number
}

type ChartPeriodSnapshot = {
  key: string
  label: string
  points: ChartPoint[]
  stats: ChartStats
}

type IndexMetric = {
  label: string
  value: number
  changeRate: number
  periods: ChartPeriodSnapshot[]
}

type MarketSection = {
  market: string
  title: string
  indices: IndexMetric[]
}

type WatchItem = {
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
}

type HoldingPosition = {
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
}

type PortfolioSummary = {
  totalCost: number
  totalValue: number
  totalProfit: number
  totalProfitRate: number
  positions: HoldingPosition[]
}

type MarketSectionsData = {
  generatedAt: string
  koreaMarket: MarketSection
  usMarket: MarketSection
}

type RecommendationExecutionLog = {
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
}

type MarketSummaryData = {
  generatedAt: string
  marketStatus: string
  summary: string
  marketSummary: SummaryMetric[]
  alternativeSignals: AlternativeSignal[]
  watchAlerts: WatchAlert[]
  marketSessions: MarketSessionStatus[]
  briefing?: {
    headline: string
    preMarket: string[]
    afterMarket: string[]
  }
}

type AiRecommendationData = {
  generatedDate: string
  summary: string
  executionLogs: RecommendationExecutionLog[]
}

type WatchlistResponse = {
  generatedAt: string
  watchlist: WatchItem[]
}

type PortfolioResponse = {
  generatedAt: string
  portfolio: PortfolioSummary
}

type ApiResponse<T> = {
  success: boolean
  data: T
}

type TabKey = 'home' | 'chart' | 'ai'
type LogFilter = 'ALL' | 'RECOMMEND' | 'RESULT'
type MarketKey = 'KR' | 'US'
type PeriodKey = '1D' | '1M' | '1Y'

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://signal-desk-api-production.up.railway.app'

function formatSignedRate(value?: number | null) {
  if (value == null) return '-'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('ko-KR')
}

function getMarketStatusTone(status?: string) {
  if (!status) return '#64748b'
  if (status.includes('OPEN') || status.includes('REGULAR')) return '#0f766e'
  if (status.includes('PRE') || status.includes('AFTER')) return '#a16207'
  return '#475569'
}

function getLogReturnColor(value?: number | null) {
  if (value == null) return '#64748b'
  return value >= 0 ? '#dc2626' : '#2563eb'
}

function getSessionPalette(isOpen: boolean) {
  return isOpen
    ? { backgroundColor: '#dcfce7', textColor: '#166534' }
    : { backgroundColor: '#e2e8f0', textColor: '#334155' }
}

function getMetricAccent(score: number) {
  if (score >= 70) return '#0f766e'
  if (score >= 40) return '#a16207'
  return '#b91c1c'
}

function getAlternativeSignalPalette(score: number) {
  if (score >= 75) {
    return {
      backgroundColor: '#fff1f2',
      borderColor: '#fecdd3',
      badgeBackgroundColor: '#ffe4e6',
      badgeTextColor: '#be123c',
    }
  }
  if (score >= 45) {
    return {
      backgroundColor: '#fff7ed',
      borderColor: '#fed7aa',
      badgeBackgroundColor: '#ffedd5',
      badgeTextColor: '#c2410c',
    }
  }
  return {
    backgroundColor: '#ecfeff',
    borderColor: '#bae6fd',
    badgeBackgroundColor: '#cffafe',
    badgeTextColor: '#0f766e',
  }
}

function getAlertPalette(severity: WatchAlert['severity']) {
  if (severity === 'high') {
    return { backgroundColor: '#fff1f2', borderColor: '#fecdd3', badgeColor: '#be123c', badgeBackgroundColor: '#ffe4e6' }
  }
  if (severity === 'medium') {
    return { backgroundColor: '#fff7ed', borderColor: '#fed7aa', badgeColor: '#c2410c', badgeBackgroundColor: '#ffedd5' }
  }
  return { backgroundColor: '#ecfeff', borderColor: '#bae6fd', badgeColor: '#0f766e', badgeBackgroundColor: '#cffafe' }
}

function buildMovingAverage(points: ChartPoint[], period: number) {
  return points.map((_, index) => {
    if (index + 1 < period) return null
    const window = points.slice(index + 1 - period, index + 1)
    return window.reduce((acc, item) => acc + item.close, 0) / period
  })
}

function buildLinePath(values: Array<number | null>, xAt: (index: number) => number, yAt: (value: number) => number) {
  let d = ''
  values.forEach((value, index) => {
    if (value == null) return
    const x = xAt(index)
    const y = yAt(value)
    d += d ? ` L ${x} ${y}` : `M ${x} ${y}`
  })
  return d
}

function CandleVolumeChart({
  points,
  width,
}: {
  points: ChartPoint[]
  width: number
}) {
  if (!points.length) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.metaText}>차트 데이터 없음</Text>
      </View>
    )
  }

  const outerPadding = 14
  const topPadding = 8
  const priceHeight = 180
  const volumeHeight = 70
  const totalHeight = priceHeight + volumeHeight + 28
  const chartWidth = Math.max(120, width - outerPadding * 2)
  const step = chartWidth / Math.max(1, points.length)
  const candleWidth = Math.max(4, Math.min(14, step * 0.56))

  const low = Math.min(...points.map((item) => item.low))
  const high = Math.max(...points.map((item) => item.high))
  const spread = Math.max(1, high - low)
  const paddedLow = low - spread * 0.05
  const paddedHigh = high + spread * 0.05

  const maxVolume = Math.max(...points.map((item) => item.volume), 1)
  const volumeTop = topPadding + priceHeight + 14
  const xAt = (index: number) => outerPadding + step * index + step * 0.5
  const yAt = (value: number) => topPadding + ((paddedHigh - value) / (paddedHigh - paddedLow)) * priceHeight

  const ma5 = buildMovingAverage(points, 5)
  const ma20 = buildMovingAverage(points, 20)
  const ma60 = buildMovingAverage(points, 60)
  const ma5Path = buildLinePath(ma5, xAt, yAt)
  const ma20Path = buildLinePath(ma20, xAt, yAt)
  const ma60Path = buildLinePath(ma60, xAt, yAt)
  const tickIndices = Array.from(new Set([0, Math.floor((points.length - 1) / 2), Math.max(points.length - 1, 0)]))

  return (
    <View style={styles.chartWrap}>
      <Svg width={width} height={totalHeight}>
        <Rect x={outerPadding} y={topPadding} width={chartWidth} height={priceHeight} fill="#f8fafc" rx={8} />
        <Rect x={outerPadding} y={volumeTop} width={chartWidth} height={volumeHeight} fill="#f8fafc" rx={8} />

        {points.map((item, index) => {
          const x = xAt(index)
          const openY = yAt(item.open)
          const closeY = yAt(item.close)
          const highY = yAt(item.high)
          const lowY = yAt(item.low)
          const up = item.close >= item.open
          const bodyTop = Math.min(openY, closeY)
          const bodyHeight = Math.max(1.5, Math.abs(closeY - openY))
          const volumeBarHeight = (item.volume / maxVolume) * (volumeHeight - 8)
          return (
            <View key={`${item.label}-${index}`}>
              <Line
                x1={x}
                x2={x}
                y1={highY}
                y2={lowY}
                stroke={up ? '#dc2626' : '#2563eb'}
                strokeWidth={1.2}
              />
              <Rect
                x={x - candleWidth * 0.5}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={up ? '#dc2626' : '#2563eb'}
                rx={1}
              />
              <Rect
                x={x - candleWidth * 0.5}
                y={volumeTop + volumeHeight - volumeBarHeight}
                width={candleWidth}
                height={volumeBarHeight}
                fill={up ? 'rgba(220,38,38,0.55)' : 'rgba(37,99,235,0.55)'}
                rx={1}
              />
            </View>
          )
        })}

        {ma5Path ? <Path d={ma5Path} stroke="#f59e0b" fill="none" strokeWidth={1.8} /> : null}
        {ma20Path ? <Path d={ma20Path} stroke="#6366f1" fill="none" strokeWidth={1.8} /> : null}
        {ma60Path ? <Path d={ma60Path} stroke="#10b981" fill="none" strokeWidth={1.8} /> : null}
      </Svg>
      <View style={styles.chartAxisRow}>
        {tickIndices.map((index) => (
          <Text key={`${points[index]?.label ?? index}-${index}`} style={styles.chartAxisLabel}>
            {points[index]?.label ?? '-'}
          </Text>
        ))}
      </View>
    </View>
  )
}

export default function App() {
  const { width } = useWindowDimensions()

  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [summary, setSummary] = useState<MarketSummaryData | null>(null)
  const [sections, setSections] = useState<MarketSectionsData | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendationData | null>(null)
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [logFilter, setLogFilter] = useState<LogFilter>('ALL')
  const [chartMarket, setChartMarket] = useState<MarketKey>('KR')
  const [chartPeriod, setChartPeriod] = useState<PeriodKey>('1D')
  const [selectedIndexLabel, setSelectedIndexLabel] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [summaryResponse, sectionsResponse, aiResponse, watchlistResponse, portfolioResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/market/summary`),
        fetch(`${API_BASE_URL}/api/v1/market/sections`),
        fetch(`${API_BASE_URL}/api/v1/market/ai-recommendations`),
        fetch(`${API_BASE_URL}/api/v1/market/watchlist`),
        fetch(`${API_BASE_URL}/api/v1/market/portfolio`),
      ])
      if (!summaryResponse.ok || !sectionsResponse.ok || !aiResponse.ok || !watchlistResponse.ok || !portfolioResponse.ok) {
        throw new Error('fetch failed')
      }

      const summaryJson = (await summaryResponse.json()) as ApiResponse<MarketSummaryData>
      const sectionsJson = (await sectionsResponse.json()) as ApiResponse<MarketSectionsData>
      const aiJson = (await aiResponse.json()) as ApiResponse<{ aiRecommendations: AiRecommendationData }>
      const watchlistJson = (await watchlistResponse.json()) as ApiResponse<WatchlistResponse>
      const portfolioJson = (await portfolioResponse.json()) as ApiResponse<PortfolioResponse>

      setSummary(summaryJson.data)
      setSections(sectionsJson.data)
      setAiRecommendation(aiJson.data.aiRecommendations)
      setWatchlist(watchlistJson.data.watchlist)
      setPortfolio(portfolioJson.data.portfolio)
    } catch {
      setError(`API 연결 실패: ${API_BASE_URL}`)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void loadData().finally(() => setLoading(false))
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const filteredLogs = useMemo(() => {
    const logs = aiRecommendation?.executionLogs ?? []
    if (logFilter === 'ALL') return logs.slice(0, 20)
    return logs.filter((item) => item.stage === logFilter).slice(0, 20)
  }, [aiRecommendation?.executionLogs, logFilter])

  const successRate = useMemo(() => {
    const resultLogs = (aiRecommendation?.executionLogs ?? []).filter((item) => item.realizedReturnRate != null)
    if (!resultLogs.length) return '-'
    const successCount = resultLogs.filter((item) => (item.realizedReturnRate ?? 0) >= 0).length
    return `${Math.round((successCount / resultLogs.length) * 100)}%`
  }, [aiRecommendation?.executionLogs])

  const topWatchlist = useMemo(() => watchlist.slice(0, 4), [watchlist])
  const topPortfolioPositions = useMemo(() => (portfolio?.positions ?? []).slice(0, 4), [portfolio])
  const recommendLogs = useMemo(
    () => (aiRecommendation?.executionLogs ?? []).filter((item) => item.stage === 'RECOMMEND').length,
    [aiRecommendation?.executionLogs],
  )
  const resultLogs = useMemo(
    () => (aiRecommendation?.executionLogs ?? []).filter((item) => item.stage === 'RESULT').length,
    [aiRecommendation?.executionLogs],
  )

  const activeSection = useMemo(() => {
    if (!sections) return null
    return chartMarket === 'KR' ? sections.koreaMarket : sections.usMarket
  }, [sections, chartMarket])

  useEffect(() => {
    if (!activeSection?.indices.length) return
    if (activeSection.indices.some((item) => item.label === selectedIndexLabel)) return
    setSelectedIndexLabel(activeSection.indices[0].label)
  }, [activeSection, selectedIndexLabel])

  const activeIndex = useMemo(() => {
    if (!activeSection) return null
    return activeSection.indices.find((item) => item.label === selectedIndexLabel) ?? activeSection.indices[0] ?? null
  }, [activeSection, selectedIndexLabel])

  const activePeriod = useMemo(() => {
    if (!activeIndex) return null
    return activeIndex.periods.find((item) => item.key === chartPeriod) ?? activeIndex.periods[0] ?? null
  }, [activeIndex, chartPeriod])

  const chartWidth = Math.max(300, Math.min(width - 28, 760))

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerWrap}>
        <View style={styles.headerGradient}>
          <Text style={styles.brand}>SignalDesk</Text>
          <Text style={styles.headerTitle}>Mobile Dashboard</Text>
          <Text style={styles.headerSubtitle}>시장/차트/추천 로그를 앱에서 빠르게 확인</Text>
          <Text style={styles.apiText}>API: {API_BASE_URL}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {([
          { key: 'home', label: '시장' },
          { key: 'chart', label: '차트' },
          { key: 'ai', label: 'AI 로그' },
        ] as Array<{ key: TabKey; label: string }>).map((tab) => (
          <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.metaText}>데이터 로딩 중...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>연결 오류</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorText}>API(8091) 상태와 CORS 설정을 확인해.</Text>
        </View>
      ) : null}

      {!loading && !error && activeTab === 'home' ? (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.content}
        >
          <View style={styles.primaryCard}>
            <Text style={styles.cardEyebrow}>MARKET STATUS</Text>
            <Text style={[styles.primaryValue, { color: getMarketStatusTone(summary?.marketStatus) }]}>
              {summary?.marketStatus ?? '-'}
            </Text>
            <Text style={styles.cardNote}>{summary?.summary ?? '-'}</Text>
            <Text style={styles.metaText}>업데이트: {summary?.generatedAt ?? '-'}</Text>
          </View>

          {summary?.briefing ? (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardTitle}>장전 브리핑</Text>
                <Text style={styles.metaText}>{summary.briefing.preMarket.length}개 포인트</Text>
              </View>
              <Text style={styles.cardNote}>{summary.briefing.headline}</Text>
              <View style={styles.briefingList}>
                {summary.briefing.preMarket.slice(0, 3).map((item) => (
                  <View key={item} style={styles.briefingBulletRow}>
                    <Text style={styles.briefingBullet}>•</Text>
                    <Text style={styles.briefingItem}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.heroMetricsRow}>
            <View style={[styles.heroMetricCard, styles.heroMetricCardDark]}>
              <Text style={[styles.heroMetricLabel, styles.heroMetricLabelOnDark]}>AI 성공률</Text>
              <Text style={[styles.heroMetricValue, styles.heroMetricValueOnDark]}>{successRate}</Text>
              <Text style={[styles.heroMetricFootnote, styles.heroMetricFootnoteOnDark]}>실현 수익률 기준</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricLabel}>관심종목</Text>
              <Text style={styles.heroMetricValue}>{watchlist.length}</Text>
              <Text style={styles.heroMetricFootnote}>포착 중인 시그널</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricLabel}>포트폴리오</Text>
              <Text style={[styles.heroMetricValue, { color: (portfolio?.totalProfitRate ?? 0) >= 0 ? '#dc2626' : '#2563eb' }]}>
                {portfolio ? formatSignedRate(portfolio.totalProfitRate) : '-'}
              </Text>
              <Text style={styles.heroMetricFootnote}>{portfolio?.positions.length ?? 0}개 종목 보유</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>장 세션</Text>
              <Text style={styles.metaText}>{summary?.marketSessions.length ?? 0}개 시장</Text>
            </View>
            {(summary?.marketSessions ?? []).map((session) => (
              <View key={session.market} style={styles.sessionCard}>
                <View style={styles.sessionTop}>
                  <Text style={styles.sessionName}>{session.label}</Text>
                  <Text
                    style={[
                      styles.sessionBadge,
                      {
                        backgroundColor: getSessionPalette(session.isOpen).backgroundColor,
                        color: getSessionPalette(session.isOpen).textColor,
                      },
                    ]}
                  >
                    {session.status}
                  </Text>
                </View>
                <Text style={styles.sessionMeta}>{session.localTime} · {session.phase}</Text>
                <Text style={styles.sessionNote}>{session.note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>시장 요약 지표</Text>
              <Text style={styles.metaText}>{summary?.marketSummary.length ?? 0}개</Text>
            </View>
            {(summary?.marketSummary ?? []).map((item) => (
              <View key={item.label} style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <Text style={styles.metricName}>{item.label}</Text>
                  <Text style={styles.metricState}>{item.state}</Text>
                </View>
                <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score.toFixed(1)}</Text>
                <Text style={styles.metricNote}>{item.note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>실험 지표</Text>
              <Text style={styles.metaText}>{summary?.alternativeSignals.length ?? 0}개</Text>
            </View>
            {(summary?.alternativeSignals ?? []).map((item) => (
              <View
                key={item.label}
                style={[
                  styles.metricRow,
                  styles.alternativeMetricRow,
                  {
                    backgroundColor: getAlternativeSignalPalette(item.score).backgroundColor,
                    borderColor: getAlternativeSignalPalette(item.score).borderColor,
                  },
                ]}
              >
                <View style={styles.metricLeft}>
                  <Text style={styles.metricName}>{item.label}</Text>
                  <Text style={styles.metricState}>{item.state}</Text>
                </View>
                <View style={styles.alternativeMetricTopRow}>
                  <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score}</Text>
                  <Text
                    style={[
                      styles.alternativeScoreBadge,
                      {
                        backgroundColor: getAlternativeSignalPalette(item.score).badgeBackgroundColor,
                        color: getAlternativeSignalPalette(item.score).badgeTextColor,
                      },
                    ]}
                  >
                    {item.state}
                  </Text>
                </View>
                <View style={styles.alternativeHighlightsRow}>
                  {item.highlights.map((highlight) => (
                    <Text key={`${item.label}-${highlight}`} style={styles.alternativeHighlightChip}>
                      {highlight}
                    </Text>
                  ))}
                </View>
                <Text style={styles.metricNote}>{item.note}</Text>
                <Text style={styles.metricSource}>{item.source} · Experimental</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>관심종목 이상징후</Text>
              <Text style={styles.metaText}>{summary?.watchAlerts.length ?? 0}건</Text>
            </View>
            {(summary?.watchAlerts ?? []).length ? (
              (summary?.watchAlerts ?? []).map((item) => (
                <View
                  key={`${item.category}-${item.market}-${item.ticker}`}
                  style={[
                    styles.metricRow,
                    styles.alertMetricRow,
                    {
                      backgroundColor: getAlertPalette(item.severity).backgroundColor,
                      borderColor: getAlertPalette(item.severity).borderColor,
                    },
                  ]}
                >
                  <View style={styles.metricLeft}>
                    <Text style={styles.metricName}>{item.name}</Text>
                    <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.title}</Text>
                  </View>
                  <View style={styles.alternativeMetricTopRow}>
                    <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score}</Text>
                    <Text
                      style={[
                        styles.alternativeScoreBadge,
                        {
                          backgroundColor: getAlertPalette(item.severity).badgeBackgroundColor,
                          color: getAlertPalette(item.severity).badgeColor,
                        },
                      ]}
                    >
                      {item.severity.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.alternativeHighlightsRow}>
                    {item.tags.map((tag) => (
                      <Text key={`${item.market}-${item.ticker}-${tag}`} style={styles.alternativeHighlightChip}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.metricNote}>{item.note}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>지금 바로 볼 이상징후는 없어.</Text>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>관심종목 요약</Text>
              <Text style={styles.metaText}>{watchlist.length}개</Text>
            </View>
            {topWatchlist.length ? (
              topWatchlist.map((item) => (
                <View key={`${item.market}-${item.ticker}-${item.id || item.name}`} style={styles.summaryRow}>
                  <View style={styles.metricLeft}>
                    <Text style={styles.metricName}>{item.name}</Text>
                    <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.sector}</Text>
                  </View>
                  <View style={styles.summaryValueBox}>
                    <Text style={styles.summaryMeta}>{item.stance}</Text>
                    <Text style={styles.metricScore}>{formatCompactNumber(item.price)}</Text>
                    <Text style={[styles.summaryDelta, { color: item.changeRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                      {formatSignedRate(item.changeRate)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>아직 관심종목이 없어.</Text>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>포트폴리오 요약</Text>
              <Text style={styles.metaText}>
                {portfolio ? `손익 ${formatSignedRate(portfolio.totalProfitRate)}` : '-'}
              </Text>
            </View>
            {portfolio ? (
              <View style={styles.portfolioSummaryRow}>
                <View style={styles.portfolioSummaryCard}>
                  <Text style={styles.kpiLabel}>총 평가금액</Text>
                  <Text style={styles.chartStatValue}>{formatCompactNumber(portfolio.totalValue)}</Text>
                </View>
                <View style={styles.portfolioSummaryCard}>
                  <Text style={styles.kpiLabel}>총 손익</Text>
                  <Text style={[styles.chartStatValue, { color: portfolio.totalProfit >= 0 ? '#dc2626' : '#2563eb' }]}>
                    {formatCompactNumber(portfolio.totalProfit)}
                  </Text>
                </View>
              </View>
            ) : null}
            {topPortfolioPositions.length ? (
              topPortfolioPositions.map((item) => (
                <View key={`${item.market}-${item.ticker}-${item.id || item.name}`} style={styles.summaryRow}>
                  <View style={styles.metricLeft}>
                    <Text style={styles.metricName}>{item.name}</Text>
                    <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.quantity}주</Text>
                  </View>
                  <View style={styles.summaryValueBox}>
                    <Text style={styles.metricScore}>{formatCompactNumber(item.currentPrice)}</Text>
                    <Text style={[styles.summaryDelta, { color: item.profitRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                      {formatSignedRate(item.profitRate)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>아직 보유 종목이 없어.</Text>
            )}
          </View>
        </ScrollView>
      ) : null}

      {!loading && !error && activeTab === 'chart' ? (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.content}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>지수 차트</Text>
            <View style={styles.filterRow}>
              {(['KR', 'US'] as const).map((market) => (
                <Pressable key={market} onPress={() => setChartMarket(market)} style={[styles.filterChip, chartMarket === market && styles.filterChipActive]}>
                  <Text style={[styles.filterText, chartMarket === market && styles.filterTextActive]}>
                    {market === 'KR' ? '한국' : '미국'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.filterRow}>
              {(['1D', '1M', '1Y'] as const).map((period) => (
                <Pressable key={period} onPress={() => setChartPeriod(period)} style={[styles.filterChip, chartPeriod === period && styles.filterChipActive]}>
                  <Text style={[styles.filterText, chartPeriod === period && styles.filterTextActive]}>
                    {period}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.indexChipRow}>
              {(activeSection?.indices ?? []).map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => setSelectedIndexLabel(item.label)}
                  style={[styles.indexChip, selectedIndexLabel === item.label && styles.indexChipActive]}
                >
                  <Text style={[styles.indexChipText, selectedIndexLabel === item.label && styles.indexChipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {activeIndex?.label ?? '-'} · {activePeriod?.label ?? '-'}
            </Text>
            <CandleVolumeChart points={activePeriod?.points ?? []} width={chartWidth} />
            <View style={styles.legendRow}>
              <Text style={[styles.legendText, { color: '#f59e0b' }]}>MA5</Text>
              <Text style={[styles.legendText, { color: '#6366f1' }]}>MA20</Text>
              <Text style={[styles.legendText, { color: '#10b981' }]}>MA60</Text>
            </View>
            {activePeriod ? (
              <View style={styles.chartStatsRow}>
                <View style={styles.chartStat}>
                  <Text style={styles.kpiLabel}>현재</Text>
                  <Text style={styles.chartStatValue}>{activePeriod.stats.latest.toFixed(2)}</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.kpiLabel}>고가</Text>
                  <Text style={styles.chartStatValue}>{activePeriod.stats.high.toFixed(2)}</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.kpiLabel}>저가</Text>
                  <Text style={styles.chartStatValue}>{activePeriod.stats.low.toFixed(2)}</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.kpiLabel}>거래량 평균</Text>
                  <Text style={styles.chartStatValue}>{formatCompactNumber(activePeriod.stats.averageVolume)}</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.kpiLabel}>등락률</Text>
                  <Text style={[styles.chartStatValue, { color: activePeriod.stats.changeRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                    {formatSignedRate(activePeriod.stats.changeRate)}
                  </Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.kpiLabel}>진폭</Text>
                  <Text style={styles.chartStatValue}>{activePeriod.stats.range.toFixed(2)}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      ) : null}

      {!loading && !error && activeTab === 'ai' ? (
        <FlatList
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          data={filteredLogs}
          keyExtractor={(item) => `${item.date}-${item.market}-${item.ticker}-${item.stage}`}
          ListHeaderComponent={(
            <View>
              <View style={styles.primaryCard}>
                <Text style={styles.cardEyebrow}>AI BRIEF</Text>
                <Text style={styles.primaryValue}>{aiRecommendation?.generatedDate ?? '-'}</Text>
                <Text style={styles.cardNote}>{aiRecommendation?.summary ?? '-'}</Text>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>전체 로그</Text>
                  <Text style={styles.kpiValue}>{aiRecommendation?.executionLogs.length ?? 0}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>추천 로그</Text>
                  <Text style={styles.kpiValue}>{recommendLogs}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>성과 로그</Text>
                  <Text style={styles.kpiValue}>{resultLogs}</Text>
                </View>
              </View>

              <View style={styles.filterRow}>
                {(['ALL', 'RECOMMEND', 'RESULT'] as const).map((filter) => (
                  <Pressable
                    key={filter}
                    onPress={() => setLogFilter(filter)}
                    style={[styles.filterChip, logFilter === filter && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, logFilter === filter && styles.filterTextActive]}>
                      {filter === 'ALL' ? '전체' : filter === 'RECOMMEND' ? '추천' : '성과'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.logTop}>
                <Text style={styles.logName}>{item.name} ({item.market} {item.ticker})</Text>
                <Text style={styles.logStage}>{item.stage}</Text>
              </View>
              <Text style={styles.logMeta}>{item.date} · {item.status}</Text>
              <Text style={styles.cardNote}>{item.rationale}</Text>
              <View style={styles.logBadges}>
                {item.confidence != null ? <Text style={styles.badge}>신뢰도 {item.confidence}</Text> : null}
                {item.expectedReturnRate != null ? <Text style={styles.badge}>예상 {formatSignedRate(item.expectedReturnRate)}</Text> : null}
                <Text style={[styles.badge, { color: getLogReturnColor(item.realizedReturnRate) }]}>
                  실현 {formatSignedRate(item.realizedReturnRate)}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.metaText}>표시할 로그가 없어.</Text>}
        />
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerGradient: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#0f172a',
  },
  brand: {
    color: '#93c5fd',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  headerTitle: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#cbd5e1',
    fontSize: 13,
  },
  apiText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 11,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  loadingWrap: {
    padding: 16,
    alignItems: 'center',
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: 12,
    gap: 4,
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 30,
  },
  primaryCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 6,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  cardEyebrow: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryValue: {
    color: '#0f172a',
    fontSize: 23,
    fontWeight: '800',
  },
  cardNote: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroMetricCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 12,
    gap: 6,
  },
  heroMetricCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  heroMetricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  heroMetricLabelOnDark: {
    color: '#93c5fd',
  },
  heroMetricValue: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  heroMetricValueOnDark: {
    color: '#f8fafc',
  },
  heroMetricFootnote: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
  },
  heroMetricFootnoteOnDark: {
    color: '#cbd5e1',
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    alignItems: 'center',
  },
  kpiLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  kpiValue: {
    marginTop: 4,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    backgroundColor: '#f8fafc',
    gap: 4,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  sessionBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  sessionMeta: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionNote: {
    color: '#64748b',
    fontSize: 12,
  },
  metricRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    backgroundColor: '#f8fafc',
    gap: 3,
  },
  metricLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  metricState: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  metricScore: {
    color: '#0f766e',
    fontSize: 18,
    fontWeight: '800',
  },
  metricNote: {
    color: '#64748b',
    fontSize: 12,
  },
  metricSource: {
    color: '#0369a1',
    fontSize: 11,
    fontWeight: '700',
  },
  alternativeMetricRow: {
    gap: 8,
  },
  alertMetricRow: {
    gap: 8,
  },
  alternativeMetricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  alternativeScoreBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  alternativeHighlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  alternativeHighlightChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  summaryRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryValueBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  summaryMeta: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryDelta: {
    fontSize: 12,
    fontWeight: '700',
  },
  portfolioSummaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portfolioSummaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  briefingList: {
    gap: 8,
    marginTop: 10,
  },
  briefingBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  briefingBullet: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  briefingItem: {
    flex: 1,
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  filterText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  indexChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indexChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  indexChipActive: {
    borderColor: '#0369a1',
    backgroundColor: '#e0f2fe',
  },
  indexChipText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  indexChipTextActive: {
    color: '#0c4a6e',
  },
  chartWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  chartAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  chartAxisLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyChart: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chartStat: {
    minWidth: '47%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 8,
  },
  chartStatValue: {
    marginTop: 2,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  logName: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  logStage: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  logMeta: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  logBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
})
