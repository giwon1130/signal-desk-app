import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native'
import { BarChart2, Bot, List, Target } from 'lucide-react-native'
import { useStyles } from '../styles'
import type { AiRecommendationData, LogFilter, RecommendationExecutionLog } from '../types'
import { formatSignedRate, getLogReturnColor } from '../utils'

type Props = {
  aiRecommendation: AiRecommendationData | null
  filteredLogs: RecommendationExecutionLog[]
  logFilter: LogFilter
  logQuery: string
  recommendLogs: number
  resultLogs: number
  refreshing: boolean
  onRefresh: () => Promise<void>
  onLogFilterChange: (filter: LogFilter) => void
  onLogQueryChange: (value: string) => void
}

function stageBadgeStyle(stage: string): { backgroundColor: string; color: string } {
  if (stage === 'RECOMMEND') return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
  if (stage === 'RESULT')    return { backgroundColor: '#dcfce7', color: '#15803d' }
  return { backgroundColor: '#f1f5f9', color: '#475569' }
}

export function AITab({
  aiRecommendation,
  filteredLogs,
  logFilter,
  logQuery,
  recommendLogs,
  resultLogs,
  refreshing,
  onRefresh,
  onLogFilterChange,
  onLogQueryChange,
}: Props) {
  const styles = useStyles()
  return (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      data={filteredLogs}
      keyExtractor={(item) => `${item.date}-${item.market}-${item.ticker}-${item.stage}`}
      ListHeaderComponent={(
        <View style={{ gap: 10 }}>
          {/* ── AI Brief ── */}
          <View style={styles.primaryCard}>
            <View style={styles.cardTitleRow}>
              <Bot size={13} color="#3b82f6" strokeWidth={2.5} />
              <Text style={styles.cardEyebrow}>AI BRIEF</Text>
            </View>
            <Text style={styles.primaryValue}>{aiRecommendation?.generatedDate ?? '-'}</Text>
            <Text style={styles.cardNote}>{aiRecommendation?.summary ?? '-'}</Text>
          </View>

          {/* ── KPI ── */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <List size={14} color="#64748b" strokeWidth={2} />
              <Text style={styles.kpiLabel}>전체 로그</Text>
              <Text style={styles.kpiValue}>{aiRecommendation?.executionLogs.length ?? 0}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Target size={14} color="#1d4ed8" strokeWidth={2} />
              <Text style={styles.kpiLabel}>추천 로그</Text>
              <Text style={[styles.kpiValue, { color: '#1d4ed8' }]}>{recommendLogs}</Text>
            </View>
            <View style={styles.kpiCard}>
              <BarChart2 size={14} color="#15803d" strokeWidth={2} />
              <Text style={styles.kpiLabel}>성과 로그</Text>
              <Text style={[styles.kpiValue, { color: '#15803d' }]}>{resultLogs}</Text>
            </View>
          </View>

          {/* ── 필터 ── */}
          <View style={styles.filterRow}>
            {(['ALL', 'RECOMMEND', 'RESULT'] as const).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => onLogFilterChange(filter)}
                style={[styles.filterChip, logFilter === filter && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, logFilter === filter && styles.filterTextActive]}>
                  {filter === 'ALL' ? '전체' : filter === 'RECOMMEND' ? '추천' : '성과'}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={logQuery}
            onChangeText={onLogQueryChange}
            placeholder="AI 로그 검색: 종목명, 티커, 상태"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}
      renderItem={({ item }) => {
        const stageSt = stageBadgeStyle(item.stage)
        return (
          <View style={[styles.card, { marginTop: 10 }]}>
            <View style={styles.logTop}>
              <Text style={styles.logName}>{item.name} <Text style={styles.logMeta}>({item.market} {item.ticker})</Text></Text>
              <Text style={[styles.logStage, stageSt]}>{item.stage}</Text>
            </View>
            <Text style={styles.logMeta}>{item.date} · {item.status}</Text>
            <Text style={styles.cardNote}>{item.rationale}</Text>
            <View style={styles.logBadges}>
              {item.confidence != null ? (
                <Text style={styles.badge}>신뢰도 {item.confidence}%</Text>
              ) : null}
              {item.expectedReturnRate != null ? (
                <Text style={styles.badge}>예상 {formatSignedRate(item.expectedReturnRate)}</Text>
              ) : null}
              {item.realizedReturnRate != null ? (
                <Text style={[styles.badge, { color: getLogReturnColor(item.realizedReturnRate), borderColor: getLogReturnColor(item.realizedReturnRate) }]}>
                  실현 {formatSignedRate(item.realizedReturnRate)}
                </Text>
              ) : null}
            </View>
          </View>
        )
      }}
      ListEmptyComponent={<Text style={[styles.metaText, { marginTop: 10 }]}>표시할 로그가 없어.</Text>}
    />
  )
}
