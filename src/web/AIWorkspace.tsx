/**
 * 웹 전용 AI 워크스페이스 — Phase 6.
 *
 * 기존 AITab 은 "로그 뷰어" 였음. 아무도 안 쓰는 탭이 됨.
 *
 * 재정의: AI 탭은 "오늘 행동" + "AI 신뢰도 검증" 두 가지 역할.
 *
 * ├─ 오늘의 플레이북 (기본)       — 지금 뭐 해야 함?
 * │  · DailyBriefing.actionItems (이미 백엔드에서 내려오는 것)
 * │  · 오늘 추천 Top 픽 (executionLogs 중 RECOMMEND 최신)
 * │  · 각 카드 원클릭: 상세 열기 / 관심 추가
 * │
 * └─ AI 성적표                    — AI 를 믿어도 되나?
 *    · 핵심 지표 (승률 / 평균 / 최고 / 최저)
 *    · 내 참여율 (추천 중 관심 추가했거나 보유한 비율)
 *    · "놓친 픽" (관심 안 넣었는데 realized > 0)
 *    · "따라간 픽" (userStatus=HELD/WATCHED) 성과
 *    · 섹터·확신도 × 수익률 히트맵
 *
 * 데이터는 기존에 이미 로드 중이던 aiRecommendation.{executionLogs, metrics}
 * + summary.briefing.actionItems 만 사용. 백엔드 추가 0.
 *
 * 본 파일은 라우팅 + 서브탭 토글만 담당. 플레이북은 네이티브 Playbook 을 재사용,
 * 스코어카드는 widgets/AIScorecard.tsx.
 */
import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BookOpen, CalendarRange, Layers, Sparkles, Trophy } from 'lucide-react-native'
import { SeasonalityRulesModal } from '../components/SeasonalityRulesModal'
import { SectorRotationModal } from '../components/SectorRotationModal'
import { ResponsiveGrid } from './shared'
import type {
  AiPicksData,
  AiRecommendationData,
  HiddenSignalsData,
  MarketInsightData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../types'
import { useTheme, type Palette } from '../theme'
import { Scorecard } from './widgets/AIScorecard'
// 네이티브 AI탭과 동일 구성 — RN 위젯을 웹에서도 그대로 재사용.
import { Playbook as NativePlaybook } from '../tabs/aitab_widgets/Playbook'
import { HiddenSignals as NativeHiddenSignals } from '../tabs/aitab_widgets/HiddenSignals'

type Mode = 'playbook' | 'scorecard'

type Props = {
  aiRecommendation: AiRecommendationData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  aiPicks: AiPicksData | null
  hiddenSignals: HiddenSignalsData | null
  marketInsight: MarketInsightData | null
  marketPreference?: 'KR' | 'US' | 'BOTH'
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
  /** 글로벌 시데 AI 모달 열기 (FAB 와 동일 인스턴스 — 대화 세션 공유) */
  onOpenAssistant: () => void
}

// memo: AppShell 재렌더(다른 탭 상태 변화 등)에 끌려 다시 그리지 않도록.
export const AIWorkspace = React.memo(function AIWorkspace({ aiRecommendation, summary, watchlist, aiPicks, hiddenSignals, marketInsight, marketPreference = 'BOTH', onOpenDetail, onQuickAddWatch, onOpenAssistant }: Props) {
  const { palette } = useTheme()
  const [mode, setMode] = useState<Mode>('playbook')
  const [rulesOpen, setRulesOpen] = useState(false)
  const [sectorOpen, setSectorOpen] = useState(false)

  // 네이티브 AITab 과 동일한 도구 진입 3종 — 데스크톱은 한 행에.
  const tools = [
    {
      key: 'assistant', icon: <Sparkles size={18} color={palette.blue} strokeWidth={2.4} />,
      bg: palette.blueSoft ?? palette.surfaceAlt,
      title: '시데 AI에게 물어보기', desc: '내 보유·관심 종목과 오늘 시장을 알고 답하는 비서',
      onPress: onOpenAssistant,
    },
    {
      key: 'rules', icon: <CalendarRange size={18} color={palette.purple ?? '#7c3aed'} strokeWidth={2.4} />,
      bg: palette.purpleSoft ?? palette.surfaceAlt,
      title: '내 시즌 규칙', desc: '저장한 시즈널 패턴 + 트리거 알림 관리',
      onPress: () => setRulesOpen(true),
    },
    {
      key: 'sector', icon: <Layers size={18} color={palette.teal ?? '#0d9488'} strokeWidth={2.4} />,
      bg: palette.tealSoft ?? palette.surfaceAlt,
      title: '섹터 로테이션', desc: '이번 달 강한 섹터 + 연간 히트맵',
      onPress: () => setSectorOpen(true),
    },
  ]

  return (
    <View style={{ gap: 20, minWidth: 0 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 20 }}>분석은 참고 자료입니다. 후보의 근거와 주의사항을 함께 확인해 주세요.</Text>
      <ResponsiveGrid columns={3} minColumnWidth={230}>
        {tools.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            onPress={t.onPress}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: palette.surface,
              borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13,
              borderWidth: 1, borderColor: palette.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {t.icon}
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{t.title}</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11 }} numberOfLines={1}>{t.desc}</Text>
            </View>
          </Pressable>
        ))}
      </ResponsiveGrid>

      <Header mode={mode} onChange={setMode} palette={palette} />
      <View key={mode}>
        {mode === 'playbook' ? (
          <View style={{ gap: 14 }}>
            {/* 네이티브 AI탭과 동일: 마켓 인사이트 + 액션 + AI 픽 */}
            <NativePlaybook
              aiPicks={aiPicks}
              summary={summary}
              watchlist={watchlist}
              marketInsight={marketInsight}
              palette={palette}
              onOpenDetail={onOpenDetail}
              onQuickAddWatch={onQuickAddWatch}
            />
            {/* 숨은 시그널 — 보유·관심 종목 공시/수급/급등락 */}
            <NativeHiddenSignals
              signals={hiddenSignals?.signals ?? []}
              palette={palette}
              onOpenDetail={onOpenDetail}
            />
          </View>
        ) : (
          <Scorecard aiRecommendation={aiRecommendation} palette={palette} onOpenDetail={onOpenDetail} />
        )}
      </View>
      <SeasonalityRulesModal visible={rulesOpen} onClose={() => setRulesOpen(false)} onOpenDetail={onOpenDetail} />
      <SectorRotationModal
        visible={sectorOpen}
        onClose={() => setSectorOpen(false)}
        initialMarket={marketPreference === 'US' ? 'US' : 'KR'}
      />
    </View>
  )
})

/* ── Header: 서브탭 토글 ──────────────────────────────── */

function Header({ mode, onChange, palette }: { mode: Mode; onChange: (m: Mode) => void; palette: Palette }) {
  const tabs: Array<{ key: Mode; label: string; icon: React.ReactNode; hint: string }> = [
    { key: 'playbook', label: '오늘의 분석', icon: <BookOpen size={13} strokeWidth={2.5} />, hint: '' },
    { key: 'scorecard', label: '추천 기록', icon: <Trophy size={13} strokeWidth={2.5} />, hint: '' },
  ]
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {tabs.map((t) => {
        const active = mode === t.key
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.key)}
            style={[{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 14, paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: active ? palette.blue : palette.surface,
              borderWidth: 1,
              borderColor: active ? palette.blue : palette.border,
            }]}
          >
            {React.cloneElement(t.icon as any, { color: active ? '#ffffff' : palette.inkSub })}
            <Text style={{ color: active ? '#ffffff' : palette.ink, fontSize: 13, fontWeight: '800' }}>
              {t.label}
            </Text>
            <Text style={{ color: active ? 'rgba(255,255,255,0.75)' : palette.inkMuted, fontSize: 11, fontWeight: '600' }}>
              {t.hint}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
