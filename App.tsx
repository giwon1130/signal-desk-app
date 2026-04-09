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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8091'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [summary, setSummary] = useState<MarketSummaryData | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

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

  const topLogs = useMemo(() => aiRecommendation?.executionLogs.slice(0, 12) ?? [], [aiRecommendation])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.brand}>SignalDesk App</Text>
        <Text style={styles.subText}>API: {API_BASE_URL}</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab('home')}
          style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>시장 요약</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('ai')}
          style={[styles.tabButton, activeTab === 'ai' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>AI 로그</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.subText}>데이터 로딩 중...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorText}>로컬 디버깅이면 API 서버(8091) 실행 상태를 확인해.</Text>
        </View>
      ) : null}

      {!loading && !error && activeTab === 'home' ? (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.content}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>시장 상태</Text>
            <Text style={styles.bigValue}>{summary?.marketStatus ?? '-'}</Text>
            <Text style={styles.note}>{summary?.summary ?? '-'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>장 세션</Text>
            {(summary?.marketSessions ?? []).map((session) => (
              <View key={session.market} style={styles.row}>
                <Text style={styles.rowTitle}>{session.label}</Text>
                <Text style={styles.rowValue}>{session.status}</Text>
                <Text style={styles.rowNote}>{session.localTime} · {session.note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>요약 지표</Text>
            {(summary?.marketSummary ?? []).map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowTitle}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.score.toFixed(1)}</Text>
                <Text style={styles.rowNote}>{item.state} · {item.note}</Text>
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
          data={topLogs}
          keyExtractor={(item) => `${item.date}-${item.market}-${item.ticker}-${item.stage}`}
          ListHeaderComponent={(
            <View style={styles.card}>
              <Text style={styles.cardTitle}>AI 추천 브리프</Text>
              <Text style={styles.bigValue}>{aiRecommendation?.generatedDate ?? '-'}</Text>
              <Text style={styles.note}>{aiRecommendation?.summary ?? '-'}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name} ({item.market} {item.ticker})</Text>
              <Text style={styles.rowValue}>{item.status} · {item.stage}</Text>
              <Text style={styles.rowNote}>{item.rationale}</Text>
              <Text style={styles.rowNote}>
                신뢰도 {item.confidence ?? '-'} · 예상 {item.expectedReturnRate?.toFixed(2) ?? '-'}% · 실현 {item.realizedReturnRate?.toFixed(2) ?? '-'}%
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.subText}>로그 데이터 없음</Text>}
        />
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subText: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabText: {
    color: '#475569',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  loadingBox: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorBox: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: 12,
    gap: 6,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
  },
  bigValue: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  note: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    gap: 3,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowTitle: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 13,
  },
  rowValue: {
    color: '#0f766e',
    fontWeight: '700',
    fontSize: 13,
  },
  rowNote: {
    color: '#64748b',
    fontSize: 12,
  },
});
