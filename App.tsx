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
  View,
} from 'react-native'

type SummaryMetric = {
  label: string
  score: number
  state: string
  note: string
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
  marketSessions: MarketSessionStatus[]
}

type AiRecommendationData = {
  generatedDate: string
  summary: string
  executionLogs: RecommendationExecutionLog[]
}

type ApiResponse<T> = {
  success: boolean
  data: T
}

type TabKey = 'home' | 'ai'
type LogFilter = 'ALL' | 'RECOMMEND' | 'RESULT'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8091'

function formatSignedRate(value?: number | null) {
  if (value == null) return '-'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [summary, setSummary] = useState<MarketSummaryData | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [logFilter, setLogFilter] = useState<LogFilter>('ALL')

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [summaryResponse, aiResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/market/summary`),
        fetch(`${API_BASE_URL}/api/v1/market/ai-recommendations`),
      ])
      if (!summaryResponse.ok || !aiResponse.ok) {
        throw new Error('fetch failed')
      }

      const summaryJson = (await summaryResponse.json()) as ApiResponse<MarketSummaryData>
      const aiJson = (await aiResponse.json()) as ApiResponse<{ aiRecommendations: AiRecommendationData }>
      setSummary(summaryJson.data)
      setAiRecommendation(aiJson.data.aiRecommendations)
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerWrap}>
        <View style={styles.headerGradient}>
          <Text style={styles.brand}>SignalDesk</Text>
          <Text style={styles.headerTitle}>Mobile Dashboard</Text>
          <Text style={styles.headerSubtitle}>시장/추천 로그를 한 화면에서 빠르게 확인</Text>
          <Text style={styles.apiText}>API: {API_BASE_URL}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable onPress={() => setActiveTab('home')} style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}>
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>시장</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('ai')} style={[styles.tabButton, activeTab === 'ai' && styles.tabButtonActive]}>
          <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>AI 로그</Text>
        </Pressable>
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

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>세션</Text>
              <Text style={styles.kpiValue}>{summary?.marketSessions.length ?? 0}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>요약 지표</Text>
              <Text style={styles.kpiValue}>{summary?.marketSummary.length ?? 0}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AI 성공률</Text>
              <Text style={styles.kpiValue}>{successRate}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>장 세션</Text>
            {(summary?.marketSessions ?? []).map((session) => (
              <View key={session.market} style={styles.sessionCard}>
                <View style={styles.sessionTop}>
                  <Text style={styles.sessionName}>{session.label}</Text>
                  <Text style={[styles.sessionBadge, { backgroundColor: session.isOpen ? '#dcfce7' : '#e2e8f0', color: session.isOpen ? '#166534' : '#334155' }]}>
                    {session.status}
                  </Text>
                </View>
                <Text style={styles.sessionMeta}>{session.localTime} · {session.phase}</Text>
                <Text style={styles.sessionNote}>{session.note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>시장 요약 지표</Text>
            {(summary?.marketSummary ?? []).map((item) => (
              <View key={item.label} style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <Text style={styles.metricName}>{item.label}</Text>
                  <Text style={styles.metricState}>{item.state}</Text>
                </View>
                <Text style={styles.metricScore}>{item.score.toFixed(1)}</Text>
                <Text style={styles.metricNote}>{item.note}</Text>
              </View>
            ))}
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
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
