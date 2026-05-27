/**
 * AITab — 마켓 인사이트 + 오늘 해야할 것 + 오늘의 AI 픽.
 * AI 픽은 Gemini 가 급등락/수급 universe 안에서 고른 단타 후보.
 * 섹션별 하위 컴포넌트로 분리됨 — playbook_parts/* 참조.
 */
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { Check, Sparkles, Target } from 'lucide-react-native'
import type { Palette } from '../../theme'
import type {
  AiPicksData,
  BriefingAction,
  MarketInsightData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../../types'
import { Card } from './Card'
import { ActionItemCard } from './playbook_parts/ActionItemCard'
import { InsightCard, InsightCardSkeleton } from './playbook_parts/InsightCard'
import { PickCard } from './playbook_parts/PickCard'

export function Playbook({
  aiPicks, summary, watchlist, marketInsight, palette, onOpenDetail, onQuickAddWatch,
}: {
  aiPicks: AiPicksData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  marketInsight: MarketInsightData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
  onQuickAddWatch: (s: StockSearchResult) => Promise<void>
}) {
  const briefing = summary?.briefing
  const actionItems: BriefingAction[] = briefing?.actionItems ?? []
  const picks = aiPicks?.picks ?? []
  const watchSet = useMemo(
    () => new Set(watchlist.map((w) => `${w.market}:${w.ticker}`)),
    [watchlist],
  )

  return (
    <View style={{ gap: 14 }}>
      {marketInsight ? (
        <InsightCard insight={marketInsight} palette={palette} />
      ) : (
        <InsightCardSkeleton palette={palette} />
      )}

      <Card
        palette={palette}
        title="오늘 해야할 것"
        icon={<Target size={13} color={palette.blue} strokeWidth={2.5} />}
        meta={actionItems.length > 0 ? `${actionItems.length}건` : undefined}
      >
        {actionItems.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
            <Check size={20} color={palette.inkFaint} />
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>오늘 따로 액션 없음</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>시장 흐름만 확인하고 현금 지키기</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {actionItems.map((a, i) => (
              <ActionItemCard
                key={`${a.title}-${i}`}
                action={a}
                palette={palette}
                onOpenDetail={onOpenDetail}
                inWatch={!!(a.market && a.ticker && watchSet.has(`${a.market}:${a.ticker}`))}
              />
            ))}
          </View>
        )}
      </Card>

      <Card
        palette={palette}
        title="오늘의 AI 픽"
        icon={<Sparkles size={13} color={palette.purple} strokeWidth={2.5} />}
        meta={picks.length > 0 ? `${picks.length}건` : undefined}
      >
        {aiPicks?.summary ? (
          <Text style={{ color: palette.inkMuted, fontSize: 12, marginBottom: 10, lineHeight: 16 }}>
            {aiPicks.summary}
          </Text>
        ) : null}
        {picks.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>AI 추천 준비 중</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>오늘 픽이 산출되면 여기 떠</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {picks.map((pick) => (
              <PickCard
                key={`${pick.market}-${pick.ticker}`}
                pick={pick}
                palette={palette}
                inWatch={watchSet.has(`${pick.market}:${pick.ticker}`)}
                onOpenDetail={onOpenDetail}
                onQuickAdd={async () => {
                  await onQuickAddWatch({
                    ticker: pick.ticker,
                    name: pick.name,
                    market: pick.market,
                    sector: '',
                    price: 0,
                    changeRate: 0,
                    stance: 'WATCH',
                  })
                }}
              />
            ))}
          </View>
        )}
      </Card>
    </View>
  )
}
