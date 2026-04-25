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
 * 본 파일은 라우팅 + 서브탭 토글만 담당. 실제 콘텐츠는
 * widgets/AIPlaybook.tsx 와 widgets/AIScorecard.tsx 로 분리.
 */
import React, { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { BookOpen, Trophy } from 'lucide-react-native'
import type {
  AiRecommendationData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../types'
import { useTheme, type Palette } from '../theme'
import { Playbook } from './widgets/AIPlaybook'
import { Scorecard } from './widgets/AIScorecard'

type Mode = 'playbook' | 'scorecard'

type Props = {
  aiRecommendation: AiRecommendationData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
}

export function AIWorkspace({ aiRecommendation, summary, watchlist, onOpenDetail, onQuickAddWatch }: Props) {
  const { palette } = useTheme()
  const [mode, setMode] = useState<Mode>('playbook')

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
      <Header mode={mode} onChange={setMode} palette={palette} />
      {mode === 'playbook' ? (
        <Playbook
          aiRecommendation={aiRecommendation}
          summary={summary}
          watchlist={watchlist}
          palette={palette}
          onOpenDetail={onOpenDetail}
          onQuickAddWatch={onQuickAddWatch}
        />
      ) : (
        <Scorecard aiRecommendation={aiRecommendation} palette={palette} onOpenDetail={onOpenDetail} />
      )}
    </ScrollView>
  )
}

/* ── Header: 서브탭 토글 ──────────────────────────────── */

function Header({ mode, onChange, palette }: { mode: Mode; onChange: (m: Mode) => void; palette: Palette }) {
  const tabs: Array<{ key: Mode; label: string; icon: React.ReactNode; hint: string }> = [
    { key: 'playbook', label: '오늘의 플레이북', icon: <BookOpen size={13} strokeWidth={2.5} />, hint: '지금 뭐 할지' },
    { key: 'scorecard', label: '성적표', icon: <Trophy size={13} strokeWidth={2.5} />, hint: 'AI 검증' },
  ]
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {tabs.map((t) => {
        const active = mode === t.key
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 14, paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: active ? palette.blue : palette.surface,
              borderWidth: 1,
              borderColor: active ? palette.blue : palette.border,
            }}
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
