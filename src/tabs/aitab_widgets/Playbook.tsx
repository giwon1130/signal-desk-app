/**
 * AITab — 마켓 인사이트 + 오늘 해야할 것 + 오늘의 AI 픽.
 * AI 픽은 Gemini 가 급등락/수급 universe 안에서 고른 단타 후보.
 */
import React, { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { AlertTriangle, Check, Plus, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { Palette } from '../../theme'
import type {
  AiPick,
  AiPicksData,
  BriefingAction,
  MarketInsightData,
  MarketSummaryData,
  StockSearchResult,
  WatchItem,
} from '../../types'
import { formatSignedRate } from '../../utils'
import { hapticLight } from '../../utils/haptics'
import { Card } from './Card'

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

function InsightCardSkeleton({ palette }: { palette: Palette }) {
  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} color={palette.inkFaint} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
          GEMINI · 오늘의 마켓 종합 인사이트
        </Text>
      </View>
      <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>
        AI 인사이트 불러오는 중…
      </Text>
      <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 16 }}>
        VIX·지수·뉴스 종합 분석에 잠시 시간이 걸려.
      </Text>
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
  pick, palette, inWatch, onOpenDetail, onQuickAdd,
}: {
  pick: AiPick
  palette: Palette
  inWatch: boolean
  onOpenDetail: (m: string, t: string, n?: string) => void
  onQuickAdd: () => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const exp = pick.expectedReturnRate
  return (
    <Pressable
      onPress={() => { void hapticLight(); onOpenDetail(pick.market, pick.ticker, pick.name) }}
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
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{pick.market}</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>{pick.ticker}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800' }}>
          확신 {pick.confidence}%
        </Text>
        {exp != null ? (
          <Text style={{ color: simpleDelta(exp, palette), fontSize: 10, fontWeight: '800' }}>
            기대 {formatSignedRate(exp)}
          </Text>
        ) : null}
      </View>
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>
        {pick.name}
      </Text>
      <Text numberOfLines={3} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15 }}>
        {pick.reason || '—'}
      </Text>
      {pick.riskNote ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: palette.downSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4,
        }}>
          <AlertTriangle size={10} color={palette.down} strokeWidth={2.5} />
          <Text style={{ color: palette.down, fontSize: 10, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {pick.riskNote}
          </Text>
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

function InsightCard({ insight, palette }: { insight: MarketInsightData; palette: Palette }) {
  const sentimentColor =
    insight.sentiment === 'BULLISH' ? palette.up :
    insight.sentiment === 'BEARISH' ? palette.down : palette.inkSub
  const SentimentIcon =
    insight.sentiment === 'BULLISH' ? TrendingUp :
    insight.sentiment === 'BEARISH' ? TrendingDown : AlertTriangle

  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} color={palette.purple} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, flex: 1 }}>
          GEMINI · 오늘의 마켓 종합 인사이트
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <SentimentIcon size={11} color={sentimentColor} strokeWidth={2.5} />
          <Text style={{ color: sentimentColor, fontSize: 10, fontWeight: '800' }}>
            {insight.sentiment === 'BULLISH' ? '강세' : insight.sentiment === 'BEARISH' ? '약세' : '중립'}
          </Text>
        </View>
      </View>
      <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900', lineHeight: 22 }}>
        {insight.headline}
      </Text>
      <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 18 }}>
        {insight.summary}
      </Text>
      {insight.keyPoints.length > 0 ? (
        <View style={{ gap: 4 }}>
          {insight.keyPoints.map((pt, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Text style={{ color: palette.purple, fontSize: 11, fontWeight: '800', marginTop: 1 }}>·</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16, flex: 1 }}>{pt}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function simpleDelta(value: number | null | undefined, palette: Palette) {
  if (value == null || Number.isNaN(value)) return palette.inkSub
  if (value > 0) return palette.up
  if (value < 0) return palette.down
  return palette.inkSub
}
