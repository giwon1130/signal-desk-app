/**
 * AI 인사이트 허브.
 *
 * 단일 스크롤: 마켓 브리핑 → 나에게 맞춘 액션 → 오늘의 AI 픽 → 숨은 시그널.
 * AI 픽은 Gemini 종목 추천, 숨은 시그널은 보유/관심 종목의 공시·수급·급등락 실데이터.
 */
import { RefreshControl, ScrollView } from 'react-native'
import { useTheme } from '../theme'
import type {
  AiPicksData,
  HiddenSignalsData,
  MarketInsightData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../types'
import { HiddenSignals } from './aitab_widgets/HiddenSignals'
import { Playbook } from './aitab_widgets/Playbook'

type Props = {
  aiPicks: AiPicksData | null
  hiddenSignals: HiddenSignalsData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  marketInsight: MarketInsightData | null
  refreshing: boolean
  onRefresh: () => Promise<void>
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
}

export function AITab({
  aiPicks, hiddenSignals, summary, watchlist, marketInsight, refreshing, onRefresh, onOpenDetail, onQuickAddWatch,
}: Props) {
  const { palette } = useTheme()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.inkMuted} />}
    >
      {/* ── 마켓 브리핑 + 액션 + AI 픽 ── */}
      <Playbook
        aiPicks={aiPicks}
        summary={summary}
        watchlist={watchlist}
        marketInsight={marketInsight}
        palette={palette}
        onOpenDetail={onOpenDetail}
        onQuickAddWatch={onQuickAddWatch}
      />

      {/* ── 숨은 시그널 — 보유·관심 종목 공시/수급/급등락 ── */}
      <HiddenSignals
        signals={hiddenSignals?.signals ?? []}
        palette={palette}
        onOpenDetail={onOpenDetail}
      />
    </ScrollView>
  )
}
