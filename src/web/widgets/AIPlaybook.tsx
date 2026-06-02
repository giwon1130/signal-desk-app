/**
 * AI 워크스페이스 — 오늘의 플레이북 (Playbook 서브탭).
 * 섹션별 하위 컴포넌트로 분리됨 — aiplaybook_parts/* 참조.
 */
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { Check, Sparkles, Target } from 'lucide-react-native'
import type {
  AiRecommendationData,
  BriefingAction,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../../types'
import { type Palette } from '../../theme'
import { Widget, webGrid } from '../shared'
import { ActionItemCard } from './aiplaybook_parts/ActionItemCard'
import { BriefingHero } from './aiplaybook_parts/BriefingHero'
import { PickCard } from './aiplaybook_parts/PickCard'

export function Playbook({
  aiRecommendation, summary, watchlist, palette, onOpenDetail, onQuickAddWatch,
}: {
  aiRecommendation: AiRecommendationData | null
  summary: MarketSummaryData | null
  watchlist: WatchItem[]
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
  onQuickAddWatch: (s: StockSearchResult) => Promise<void>
}) {
  const briefing = summary?.briefing
  const actionItems: BriefingAction[] = briefing?.actionItems ?? []
  const todayPicks = useMemo(() => {
    const logs = aiRecommendation?.executionLogs ?? []
    return logs
      .filter((l) => l.stage?.toUpperCase().includes('RECOMMEND'))
      .slice(0, 6)
  }, [aiRecommendation])

  const watchSet = useMemo(
    () => new Set(watchlist.map((w) => `${w.market}:${w.ticker}`)),
    [watchlist],
  )

  // 휴장 모드 — 양쪽 시장 다 닫혔을 때. UI 톤이 "실행" 에서 "준비/시뮬레이션" 으로 바뀜.
  const td = summary?.tradingDayStatus
  const marketClosed = !!td && !td.krOpen && !td.usOpen

  return (
    <View style={{ gap: 14 }}>
      {/* 상단 브리핑 히어로 */}
      <BriefingHero summary={summary} palette={palette} />

      {/* 액션 아이템 */}
      <Widget
        palette={palette}
        title="오늘 해야할 것"
        icon={<Target size={13} color={palette.blue} strokeWidth={2.5} />}
        meta={actionItems.length > 0 ? `${actionItems.length}건` : null}
      >
        {actionItems.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 6 }}>
            <Check size={22} color={palette.inkFaint} />
            <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '600' }}>
              오늘 따로 해야 할 액션이 없어
            </Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
              시장 흐름만 확인하고 현금 지키기
            </Text>
          </View>
        ) : (
          <View style={[{ gap: 10 }, webGrid('repeat(auto-fill, minmax(280px, 1fr))')]}>
            {actionItems.map((a, i) => (
              <ActionItemCard
                key={`${a.title}-${i}`}
                action={a}
                palette={palette}
                onOpenDetail={onOpenDetail}
                inWatch={a.market && a.ticker ? watchSet.has(`${a.market}:${a.ticker}`) : false}
              />
            ))}
          </View>
        )}
      </Widget>

      {/* 오늘의 AI 픽 */}
      <Widget
        palette={palette}
        title="오늘의 AI 픽"
        icon={<Sparkles size={13} color={palette.purple} strokeWidth={2.5} />}
        meta={null}
      >
        {aiRecommendation?.summary ? (
          <Text style={{ color: palette.inkMuted, fontSize: 12, marginBottom: 10, lineHeight: 16 }}>
            {aiRecommendation.summary}
          </Text>
        ) : null}
        {marketClosed ? (
          <View style={{
            backgroundColor: palette.surfaceAlt,
            borderRadius: 8, padding: 10, marginBottom: 10,
            borderLeftWidth: 3, borderLeftColor: palette.orange,
          }}>
            <Text style={{ color: palette.inkSub, fontSize: 11, fontWeight: '700', lineHeight: 16 }}>
              지금 휴장 — 픽은 다음 거래일 후보 점검용으로만 봐 주세요. 진입가는 마감가 기준이라 다음 개장가에서 다시 잡아야 해요.
            </Text>
          </View>
        ) : null}
        {todayPicks.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>AI 추천 준비 중</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>오늘 픽이 산출되면 여기 떠</Text>
          </View>
        ) : (
          <View style={[{ gap: 10 }, webGrid('repeat(auto-fill, minmax(260px, 1fr))')]}>
            {todayPicks.map((log) => (
              <PickCard
                key={`${log.date}-${log.market}-${log.ticker}`}
                log={log}
                palette={palette}
                marketClosed={marketClosed}
                inWatch={watchSet.has(`${log.market}:${log.ticker}`)}
                onOpenDetail={onOpenDetail}
                onQuickAdd={async () => {
                  await onQuickAddWatch({
                    ticker: log.ticker,
                    name: log.name,
                    market: log.market,
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
      </Widget>
    </View>
  )
}
