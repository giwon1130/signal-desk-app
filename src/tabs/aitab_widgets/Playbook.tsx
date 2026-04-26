/**
 * AITab — 오늘의 플레이북 서브탭.
 * BriefingHero + 오늘 해야할 것 + 오늘의 AI 픽.
 */
import React, { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Check, Flame, Plus, Sparkles, Target } from 'lucide-react-native'
import type { Palette } from '../../theme'
import type {
  AiRecommendationData,
  BriefingAction,
  MarketSummaryData,
  RecommendationExecutionLog,
  StockSearchResult,
  WatchItem,
} from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'
import { hapticLight } from '../../utils/haptics'
import { Card } from './Card'

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
    return logs.filter((l) => l.stage?.toUpperCase().includes('RECOMMEND')).slice(0, 6)
  }, [aiRecommendation])
  const watchSet = useMemo(
    () => new Set(watchlist.map((w) => `${w.market}:${w.ticker}`)),
    [watchlist],
  )
  // 휴장 모드: 양쪽 시장 다 닫혔을 때 Pick UI 톤 다운.
  const td = summary?.tradingDayStatus
  const marketClosed = !!td && !td.krOpen && !td.usOpen

  return (
    <View style={{ gap: 14 }}>
      <BriefingHero summary={summary} palette={palette} />

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
        meta={todayPicks.length > 0 ? `${todayPicks.length}건` : undefined}
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
              지금 휴장 — 픽은 다음 거래일 후보 점검용. 진입가는 다음 개장가에서 다시 잡아.
            </Text>
          </View>
        ) : null}
        {todayPicks.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>AI 추천 준비 중</Text>
            <Text style={{ color: palette.inkFaint, fontSize: 11 }}>오늘 픽이 산출되면 여기 떠</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
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
      </Card>
    </View>
  )
}

function BriefingHero({ summary, palette }: { summary: MarketSummaryData | null; palette: Palette }) {
  const briefing = summary?.briefing
  const slot = briefing?.slot
  const slotLabel =
    slot === 'PRE_MARKET' ? '장 시작 전' :
    slot === 'INTRADAY'   ? '장중' :
    slot === 'POST_MARKET'? '장 마감 후' :
    slot === 'WEEKEND'    ? '주말' :
    slot === 'HOLIDAY'    ? '휴장' : null
  const headline = briefing?.headline ?? summary?.summary ?? '오늘의 브리핑을 불러오는 중…'
  const narrative = briefing?.narrative ?? ''

  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 16,
      gap: 8,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Flame size={13} color={palette.orange} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
          TODAY · BRIEFING
        </Text>
        {slotLabel ? (
          <View style={{ backgroundColor: palette.blueSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
            <Text style={{ color: palette.blue, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }}>{slotLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: palette.ink, fontSize: 17, fontWeight: '800', lineHeight: 23 }}>
        {headline}
      </Text>
      {narrative ? (
        <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 18 }}>
          {narrative}
        </Text>
      ) : null}
      {briefing?.context ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          {briefing.context.holdingPnlLabel ? (
            <ContextPill
              label="내 포지션"
              value={briefing.context.holdingPnlLabel}
              color={briefing.context.holdingPnlRate == null ? palette.inkSub : briefing.context.holdingPnlRate >= 0 ? palette.up : palette.down}
              palette={palette}
            />
          ) : null}
          {briefing.context.watchlistAlertCount > 0 ? (
            <ContextPill label="감시 알림" value={`${briefing.context.watchlistAlertCount}건`} color={palette.orange} palette={palette} />
          ) : null}
          {briefing.context.marketMood ? (
            <ContextPill label="시장 분위기" value={briefing.context.marketMood} color={palette.purple} palette={palette} />
          ) : null}
          {briefing.context.keyEvent ? (
            <ContextPill label="핵심 이벤트" value={briefing.context.keyEvent} color={palette.teal} palette={palette} />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

function ContextPill({ label, value, color, palette }: { label: string; value: string; color: string; palette: Palette }) {
  return (
    <View style={{ gap: 1 }}>
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
      <Text style={{ color, fontSize: 12, fontWeight: '800' }}>{value}</Text>
    </View>
  )
}

function ActionItemCard({
  action, palette, onOpenDetail, inWatch,
}: {
  action: BriefingAction
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
  inWatch: boolean
}) {
  const pri = action.priority
  const priColor = pri === 'high' ? palette.down : pri === 'medium' ? palette.orange : palette.teal
  const priSoft = pri === 'high' ? palette.downSoft : pri === 'medium' ? palette.orangeSoft : palette.tealSoft
  const priLabel = pri === 'high' ? '긴급' : pri === 'medium' ? '중요' : '참고'
  const clickable = !!(action.market && action.ticker)
  const onPress = clickable ? () => { void hapticLight(); onOpenDetail(action.market!, action.ticker!, action.title) } : undefined

  return (
    <Pressable
      onPress={onPress}
      disabled={!clickable}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.surfaceAlt : palette.bg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 12,
        gap: 6,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ backgroundColor: priSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: priColor, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{priLabel}</Text>
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
          {action.category}
        </Text>
        <View style={{ flex: 1 }} />
        {inWatch ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Check size={10} color={palette.up} strokeWidth={3} />
            <Text style={{ color: palette.up, fontSize: 9, fontWeight: '800' }}>관심</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800', lineHeight: 18 }} numberOfLines={2}>
        {action.title}
      </Text>
      {action.detail ? (
        <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 16 }} numberOfLines={3}>
          {action.detail}
        </Text>
      ) : null}
      {action.ticker ? (
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }}>
          {action.market} · {action.ticker}
        </Text>
      ) : null}
    </Pressable>
  )
}

function PickCard({
  log, palette, inWatch, marketClosed, onOpenDetail, onQuickAdd,
}: {
  log: RecommendationExecutionLog
  palette: Palette
  inWatch: boolean
  marketClosed?: boolean
  onOpenDetail: (m: string, t: string, n?: string) => void
  onQuickAdd: () => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const exp = log.expectedReturnRate
  return (
    <Pressable
      onPress={() => { void hapticLight(); onOpenDetail(log.market, log.ticker, log.name) }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.surfaceAlt : palette.bg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 12,
        gap: 6,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{log.market}</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>{log.ticker}</Text>
        {marketClosed ? (
          <View style={{ backgroundColor: palette.orangeSoft, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ color: palette.orange, fontSize: 9, fontWeight: '800' }}>시나리오</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {log.userStatus ? (
          <View style={{ backgroundColor: palette.blueSoft, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ color: palette.blue, fontSize: 9, fontWeight: '800' }}>{log.userStatus}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>
        {log.name}
      </Text>
      <Text numberOfLines={2} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15 }}>
        {log.rationale || '—'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {log.confidence != null ? (
          <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800' }}>
            확신 {Math.round(log.confidence * 100)}%
          </Text>
        ) : null}
        {exp != null ? (
          <Text style={{ color: simpleDelta(exp, palette), fontSize: 10, fontWeight: '800' }}>
            기대 {formatSignedRate(exp)}
          </Text>
        ) : null}
        <View style={{ flex: 1 }} />
      </View>
      {log.entryPrice != null && !marketClosed ? (
        <View style={{ flexDirection: 'row', gap: 14, paddingTop: 6, borderTopWidth: 1, borderTopColor: palette.border }}>
          <PriceTag label="진입" value={log.entryPrice} market={log.market} color={palette.inkSub} palette={palette} />
          {log.stopLoss != null ? <PriceTag label="손절" value={log.stopLoss} market={log.market} color={palette.down} palette={palette} /> : null}
          {log.takeProfit != null ? <PriceTag label="목표" value={log.takeProfit} market={log.market} color={palette.up} palette={palette} /> : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        {inWatch ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Check size={10} color={palette.up} strokeWidth={3} />
            <Text style={{ color: palette.up, fontSize: 10, fontWeight: '800' }}>관심</Text>
          </View>
        ) : (
          <Pressable
            onPress={async (e: any) => {
              e?.stopPropagation?.()
              if (adding) return
              void hapticLight()
              setAdding(true)
              try { await onQuickAdd() } finally { setAdding(false) }
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              backgroundColor: palette.blueSoft, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4,
            }}
          >
            <Plus size={10} color={palette.blue} strokeWidth={3} />
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '800' }}>
              {adding ? '추가 중…' : '관심'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  )
}

function PriceTag({ label, value, market, color, palette }: { label: string; value: number; market?: string; color: string; palette: Palette }) {
  return (
    <View style={{ gap: 1 }}>
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {formatPrice(value, market)}
      </Text>
    </View>
  )
}

function simpleDelta(value: number | null | undefined, palette: Palette) {
  if (value == null || Number.isNaN(value)) return palette.inkSub
  if (value > 0) return palette.up
  if (value < 0) return palette.down
  return palette.inkSub
}
