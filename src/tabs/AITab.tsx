import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native'
import { styles } from '../styles'
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
  return (
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
            {item.expectedReturnRate != null ? (
              <Text style={styles.badge}>예상 {formatSignedRate(item.expectedReturnRate)}</Text>
            ) : null}
            {item.realizedReturnRate != null ? (
              <Text style={[styles.badge, { color: getLogReturnColor(item.realizedReturnRate) }]}>
                실현 {formatSignedRate(item.realizedReturnRate)}
              </Text>
            ) : null}
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.metaText}>표시할 로그가 없어.</Text>}
    />
  )
}
