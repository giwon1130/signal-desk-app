/**
 * AI 인사이트 허브.
 *
 * 단일 스크롤: 마켓 브리핑 → 나에게 맞춘 액션 → 오늘의 AI 픽 → 숨은 시그널.
 * AI 픽은 Gemini 종목 추천, 숨은 시그널은 보유/관심 종목의 공시·수급·급등락 실데이터.
 */
import { memo, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { CalendarRange, ChevronRight, Layers, Sparkles } from 'lucide-react-native'
import { useTheme } from '../theme'
import type {
  AiPicksData,
  HiddenSignalsData,
  MarketInsightData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../types'
import { TabIntro } from '../components/guide/TabIntro'
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
  /** 글로벌 시데 AI 모달 열기 (FAB 와 동일 인스턴스 — 대화 세션 공유) */
  onOpenAssistant: () => void
}

// memo: AppShell 재렌더(다른 탭 상태 변화 등)에 끌려 다시 그리지 않도록.
export const AITab = memo(function AITab({
  aiPicks, hiddenSignals, summary, watchlist, marketInsight, marketPreference = 'BOTH', refreshing, onRefresh, onOpenDetail, onQuickAddWatch, onOpenAssistant,
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
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.inkMuted} />}
    >
      {/* 탭 인트로 — 컴팩트 타이틀, 처음 몇 번만 펼친 설명 */}
      <TabIntro
        tabKey="ai"
        icon={Sparkles}
        title="AI"
        tagline="물어보고 · 추천받고 · 시그널 확인"
        description="시데 AI에게 종목·시장을 직접 물어보거나, 마켓 브리핑·오늘의 AI 픽·내 종목의 숨은 시그널을 받아보세요. 시즌 규칙과 섹터 로테이션도 여기서 확인할 수 있어요."
        accent={palette.blue ?? palette.brandAccent}
      />

      {/* ── 시데 AI 비서 — 주력 진입(풀 너비) ── */}
      <Pressable
        onPress={onOpenAssistant}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: palette.scheme === 'dark' ? palette.surfaceAlt : palette.ink,
          borderWidth: 1, borderColor: palette.scheme === 'dark' ? palette.borderLight : palette.ink,
          borderRadius: 16, paddingHorizontal: 15, paddingVertical: 15,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: palette.brandAccent, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color="#07150f" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.scheme === 'dark' ? palette.ink : '#ffffff', fontSize: 14, fontWeight: '900' }}>시데 AI에게 물어보기</Text>
          <Text style={{ color: palette.scheme === 'dark' ? palette.inkMuted : '#aeb8c7', fontSize: 11, marginTop: 2 }}>내 종목과 오늘 시장을 이어서 답해요</Text>
        </View>
        <ChevronRight size={18} color={palette.scheme === 'dark' ? palette.inkMuted : '#aeb8c7'} strokeWidth={2.4} />
      </Pressable>

      {/* ── 시즌 규칙 · 섹터 로테이션 — 보조 도구는 칩 2개로 압축(본문이 폴드 아래로 안 밀리게) ── */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => setRulesOpen(true)}
          style={({ pressed }) => ({
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7,
            backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.borderLight,
            borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
            <CalendarRange size={15} color={palette.purple} strokeWidth={2.4} />
          </View>
          <Text style={{ color: palette.ink, fontSize: 12.5, fontWeight: '800', flex: 1 }} numberOfLines={1}>내 시즌 규칙</Text>
          {rulesCount ? (
            <View style={{ backgroundColor: palette.purple ?? '#7c3aed', borderRadius: 9, minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '900' }}>{rulesCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => setSectorOpen(true)}
          style={({ pressed }) => ({
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7,
            backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.borderLight,
            borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: palette.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={15} color={palette.teal} strokeWidth={2.4} />
          </View>
          <Text style={{ color: palette.ink, fontSize: 12.5, fontWeight: '800', flex: 1 }} numberOfLines={1}>섹터 로테이션</Text>
        </Pressable>
      </View>

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
      initialMarket={marketPreference === 'US' ? 'US' : 'KR'}
    />
    </>
  )
})
