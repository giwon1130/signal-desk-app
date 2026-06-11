/**
 * AI 인사이트 허브.
 *
 * 단일 스크롤: 마켓 브리핑 → 나에게 맞춘 액션 → 오늘의 AI 픽 → 숨은 시그널.
 * AI 픽은 Gemini 종목 추천, 숨은 시그널은 보유/관심 종목의 공시·수급·급등락 실데이터.
 */
import { memo, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { CalendarRange, ChevronRight, Layers } from 'lucide-react-native'
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
import { SeasonalityRulesModal } from '../components/SeasonalityRulesModal'
import { SectorRotationModal } from '../components/SectorRotationModal'
import { listSeasonalityRules } from '../api/backtest'

type Props = {
  aiPicks: AiPicksData | null
  hiddenSignals: HiddenSignalsData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  marketInsight: MarketInsightData | null
  /** 시장 선호 — 섹터 로테이션 기본 시장 등에 반영. */
  marketPreference?: 'KR' | 'US' | 'BOTH'
  refreshing: boolean
  onRefresh: () => Promise<void>
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
}

// memo: AppShell 재렌더(다른 탭 상태 변화 등)에 끌려 다시 그리지 않도록.
export const AITab = memo(function AITab({
  aiPicks, hiddenSignals, summary, watchlist, marketInsight, marketPreference = 'BOTH', refreshing, onRefresh, onOpenDetail, onQuickAddWatch,
}: Props) {
  const { palette } = useTheme()
  const [rulesOpen, setRulesOpen] = useState(false)
  const [sectorOpen, setSectorOpen] = useState(false)
  const [rulesCount, setRulesCount] = useState<number | null>(null)
  useEffect(() => { void listSeasonalityRules().then((r) => setRulesCount(r.length)) }, [rulesOpen])

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.inkMuted} />}
    >
      {/* ── 내 시즌 규칙 (알고리즘 포트폴리오) ── */}
      <Pressable
        onPress={() => setRulesOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: palette.purpleSoft ?? palette.surfaceAlt,
          borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <CalendarRange size={18} color={palette.purple ?? '#7c3aed'} strokeWidth={2.4} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>내 시즌 규칙</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>저장한 시즈널 패턴 + 트리거 알림 관리</Text>
        </View>
        {rulesCount ? (
          <View style={{ backgroundColor: palette.purple ?? '#7c3aed', borderRadius: 10, minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{rulesCount}</Text>
          </View>
        ) : null}
        <ChevronRight size={18} color={palette.inkFaint} strokeWidth={2.4} />
      </Pressable>

      {/* ── 섹터 로테이션 ── */}
      <Pressable
        onPress={() => setSectorOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: palette.tealSoft ?? palette.surfaceAlt,
          borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Layers size={18} color={palette.teal ?? '#0d9488'} strokeWidth={2.4} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>섹터 로테이션</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>이번 달 강한 섹터 + 연간 히트맵</Text>
        </View>
        <ChevronRight size={18} color={palette.inkFaint} strokeWidth={2.4} />
      </Pressable>

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
    <SeasonalityRulesModal visible={rulesOpen} onClose={() => setRulesOpen(false)} onOpenDetail={onOpenDetail} />
    <SectorRotationModal
      visible={sectorOpen}
      onClose={() => setSectorOpen(false)}
      initialMarket={marketPreference === 'KR' ? 'KR' : 'US'}
    />
    </>
  )
})
