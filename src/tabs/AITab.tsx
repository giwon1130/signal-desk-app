/**
 * 모바일 AI 탭 — 웹 AIWorkspace 와 같은 구조 (Phase 6 모바일 미러).
 *
 * 두 서브탭:
 *   ├─ 오늘의 플레이북 — 지금 뭐 해야 함?
 *   └─ 성적표 — AI 를 믿어도 되나?
 *
 * 데이터는 AITab Props 그대로. 백엔드 추가 0.
 * 실제 UI 는 aitab_widgets/Playbook.tsx, Scorecard.tsx 로 분리.
 */
import React, { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { BookOpen, Trophy } from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type {
  AiRecommendationData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../types'
import { hapticLight } from '../utils/haptics'
import { Playbook } from './aitab_widgets/Playbook'
import { Scorecard } from './aitab_widgets/Scorecard'

type Mode = 'playbook' | 'scorecard'

type Props = {
  aiRecommendation: AiRecommendationData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  refreshing: boolean
  onRefresh: () => Promise<void>
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
}

export function AITab({
  aiRecommendation, summary, watchlist, refreshing, onRefresh, onOpenDetail, onQuickAddWatch,
}: Props) {
  const { palette } = useTheme()
  const [mode, setMode] = useState<Mode>('playbook')

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.inkMuted} />}
    >
      <ModeToggle mode={mode} onChange={setMode} palette={palette} />
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

/* ── ModeToggle ────────────────────────────────────────── */

function ModeToggle({ mode, onChange, palette }: { mode: Mode; onChange: (m: Mode) => void; palette: Palette }) {
  const tabs: Array<{ key: Mode; label: string; icon: any; hint: string }> = [
    { key: 'playbook',  label: '플레이북', icon: BookOpen, hint: '오늘 할 것' },
    { key: 'scorecard', label: '성적표',   icon: Trophy,   hint: 'AI 검증' },
  ]
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {tabs.map((t) => {
        const Active = t.icon
        const isActive = mode === t.key
        return (
          <Pressable
            key={t.key}
            onPress={() => { void hapticLight(); onChange(t.key) }}
            style={{
              flex: 1,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingVertical: 11, borderRadius: 10,
              backgroundColor: isActive ? palette.blue : palette.surface,
              borderWidth: 1,
              borderColor: isActive ? palette.blue : palette.border,
            }}
          >
            <Active size={14} color={isActive ? '#ffffff' : palette.inkSub} strokeWidth={2.5} />
            <Text style={{ color: isActive ? '#ffffff' : palette.ink, fontSize: 13, fontWeight: '800' }}>
              {t.label}
            </Text>
            <Text style={{ color: isActive ? 'rgba(255,255,255,0.75)' : palette.inkMuted, fontSize: 10, fontWeight: '600' }}>
              {t.hint}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
