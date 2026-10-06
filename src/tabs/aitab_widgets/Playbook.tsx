/**
 * AITab — 마켓 인사이트 + 오늘 해야할 것 + 오늘의 AI 픽.
 * 후보 선정과 판정은 완료 일봉 기반 규칙이 담당한다.
 * 섹션별 하위 컴포넌트로 분리됨 — playbook_parts/* 참조.
 */
import { useEffect, useMemo, useState } from 'react'
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
import { isPickSnapshotStale } from '../../utils/pickReview'

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
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])
  const stale = isPickSnapshotStale(aiPicks?.generatedAt, now)
  const reviewCount = stale ? 0 : picks.filter((pick) => pick.assessment?.decision === 'REVIEW').length
  const watchSet = useMemo(
    () => new Set(watchlist.map((w) => `${w.market}:${w.ticker}`)),
    [watchlist],
  )

  return (
    <View style={{ gap: 20 }}>
      {marketInsight ? (
        <InsightCard insight={marketInsight} palette={palette} />
      ) : (
        <InsightCardSkeleton palette={palette} />
      )}

      <Card
        palette={palette}
        title="오늘의 체크리스트"
        icon={<Target size={13} color={palette.blue} strokeWidth={2.5} />}
        meta={actionItems.length > 0 ? `${actionItems.length}건` : undefined}
      >
        {actionItems.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
            <Check size={20} color={palette.inkFaint} />
            <Text style={{ color: palette.inkMuted, fontSize: 14, fontWeight: '600' }}>현재 등록된 확인 사항이 없습니다</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 12 }}>새로운 신호가 확인되면 이곳에 안내합니다.</Text>
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
        title="종목 검토"
        icon={<Sparkles size={13} color={palette.purple} strokeWidth={2.5} />}
        meta={picks.length > 0 ? `${picks.length}개 후보` : undefined}
      >
        <View style={{ backgroundColor: palette.surfaceAlt, padding: 14, borderRadius: 14, gap: 7, marginBottom: 16 }}>
          <Text style={{ color: stale && picks.length > 0 ? palette.orange : palette.ink, fontSize: 15, fontWeight: '800' }}>
            {stale && picks.length > 0 ? '최신 검토 자료를 확인해 주세요' : `지금 검토 가능한 후보 ${reviewCount}개`}
          </Text>
          <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 19 }}>
            {stale && picks.length > 0 ? '생성 후 30분이 지났거나 생성 시각이 불명확합니다. 화면을 내려 새로고침해 주세요.' : '완료된 거래일의 추세·거래량·유동성·변동성을 살펴봅니다. 매수 지시나 상승 확률을 뜻하지 않습니다.'}
          </Text>
        </View>
        {aiPicks?.summary ? (
          <Text style={{ color: palette.inkMuted, fontSize: 13, marginBottom: 16, lineHeight: 20 }}>
            {aiPicks.summary}
          </Text>
        ) : null}
        {picks.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 14, fontWeight: '600' }}>{aiPicks ? '현재 검토할 후보가 없습니다' : 'AI 검토 자료를 기다리고 있습니다'}</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 12 }}>확인할 근거가 충분할 때 후보를 안내합니다.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {picks.map((pick) => (
              <PickCard
                key={`${pick.market}-${pick.ticker}`}
                pick={pick}
                palette={palette}
                generatedAt={aiPicks?.generatedAt}
                now={now}
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
