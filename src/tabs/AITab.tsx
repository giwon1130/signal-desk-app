/**
 * AI 인사이트 허브 (A안).
 *
 * 단일 스크롤 — 2탭 토글 제거.
 * 마켓 브리핑 → 나에게 맞춘 액션 → 오늘의 픽 → 숨은 시그널 → AI 트랙 레코드.
 */
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { ChevronDown, ChevronRight } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { useTheme } from '../theme'
import type {
  AiRecommendationData,
  MarketInsightData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../types'
import { hapticLight } from '../utils/haptics'
import { HiddenSignals } from './aitab_widgets/HiddenSignals'
import { Playbook } from './aitab_widgets/Playbook'
import { Scorecard } from './aitab_widgets/Scorecard'

type Props = {
  aiRecommendation: AiRecommendationData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  marketInsight: MarketInsightData | null
  refreshing: boolean
  onRefresh: () => Promise<void>
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
}

export function AITab({
  aiRecommendation, summary, watchlist, marketInsight, refreshing, onRefresh, onOpenDetail, onQuickAddWatch,
}: Props) {
  const { palette } = useTheme()
  const [scorecardOpen, setScorecardOpen] = useState(false)
  const logs = aiRecommendation?.executionLogs ?? []

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.inkMuted} />}
    >
      {/* ── 마켓 브리핑 + 액션 + 픽 ── */}
      <Playbook
        aiRecommendation={aiRecommendation}
        summary={summary}
        watchlist={watchlist}
        marketInsight={marketInsight}
        palette={palette}
        onOpenDetail={onOpenDetail}
        onQuickAddWatch={onQuickAddWatch}
      />

      {/* ── 숨은 시그널 — 보유·관심 종목 AI 주목 ── */}
      <HiddenSignals
        logs={logs}
        watchlist={watchlist}
        palette={palette}
        onOpenDetail={onOpenDetail}
      />

      {/* ── AI 트랙 레코드 — 접힌 상태로 하단 ── */}
      <View style={{
        backgroundColor: palette.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'hidden',
      }}>
        <Pressable
          onPress={() => { void hapticLight(); setScorecardOpen((v) => !v) }}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 14, paddingVertical: 12,
            backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
          })}
          hitSlop={8}
        >
          <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800' }}>
            AI 트랙 레코드
          </Text>
          {scorecardOpen
            ? <ChevronDown size={16} color={palette.inkMuted} strokeWidth={2.5} />
            : <ChevronRight size={16} color={palette.inkMuted} strokeWidth={2.5} />}
        </Pressable>
        {scorecardOpen ? (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <Scorecard
              aiRecommendation={aiRecommendation}
              palette={palette}
              onOpenDetail={onOpenDetail}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}
