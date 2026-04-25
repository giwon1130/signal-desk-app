/**
 * 모바일 AI 탭 — 웹 AIWorkspace 와 같은 구조 (Phase 6 모바일 미러).
 *
 * 두 서브탭:
 *   ├─ 오늘의 플레이북 — 지금 뭐 해야 함?
 *   │  · BriefingHero (장 슬롯 + 헤드라인 + 컨텍스트 칩)
 *   │  · 오늘 해야할 것 (briefing.actionItems, 우선도별)
 *   │  · 오늘의 AI 픽 (executionLogs RECOMMEND 최신 + 관심 인라인 추가)
 *   │
 *   └─ 성적표 — AI 를 믿어도 되나?
 *      · 4개 메트릭 (승률 / 평균 수익률 / 참여율 / 픽 수)
 *      · 놓친 픽 (관심 안 넣었는데 올랐음)
 *      · 따라간 픽 (HELD / WATCHED 결과)
 *      · 최근 결과 컴팩트 리스트
 *
 * 데이터는 AITab Props 그대로. 백엔드 추가 0.
 *
 * 모바일은 폭이 좁아 webGrid 대신 vertical stack + 2열 metric grid 만 사용.
 */
import React, { useMemo, useState } from 'react'
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react-native'
import { useTheme, type Palette } from '../theme'
import type {
  AiRecommendationData,
  BriefingAction,
  MarketSummaryData,
  RecommendationExecutionLog,
  RecommendationMetrics,
  StockSearchResult,
  WatchItem,
} from '../types'
import { formatSignedRate } from '../utils'
import { hapticLight } from '../utils/haptics'

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

/* ── Card shell ────────────────────────────────────────── */

function Card({
  palette, title, icon, meta, children,
}: { palette: Palette; title: string; icon?: React.ReactNode; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 14,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <Text style={{ flex: 1, color: palette.ink, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>{title}</Text>
        {meta ? (
          typeof meta === 'string'
            ? <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}>{meta}</Text>
            : meta
        ) : null}
      </View>
      {children}
    </View>
  )
}

/* ──────────────── PLAYBOOK ───────────────────────────── */

function Playbook({
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
          <View style={{ paddingVertical: 18, alignItems: 'center' }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12 }}>AI 추천 준비 중</Text>
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
          <PriceTag label="진입" value={log.entryPrice} color={palette.inkSub} palette={palette} />
          {log.stopLoss != null ? <PriceTag label="손절" value={log.stopLoss} color={palette.down} palette={palette} /> : null}
          {log.takeProfit != null ? <PriceTag label="목표" value={log.takeProfit} color={palette.up} palette={palette} /> : null}
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

function PriceTag({ label, value, color, palette }: { label: string; value: number; color: string; palette: Palette }) {
  return (
    <View style={{ gap: 1 }}>
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {value.toLocaleString('ko-KR')}
      </Text>
    </View>
  )
}

/* ──────────────── SCORECARD ──────────────────────────── */

function Scorecard({
  aiRecommendation, palette, onOpenDetail,
}: {
  aiRecommendation: AiRecommendationData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const metrics = aiRecommendation?.metrics ?? null
  const logs = aiRecommendation?.executionLogs ?? []
  const results = useMemo(() => logs.filter((l) => l.realizedReturnRate != null), [logs])

  const participation = useMemo(() => {
    const recs = logs.filter((l) => l.stage?.toUpperCase().includes('RECOMMEND'))
    const engaged = recs.filter((l) => l.userStatus === 'HELD' || l.userStatus === 'WATCHED')
    const rate = recs.length === 0 ? 0 : engaged.length / recs.length
    return { total: recs.length, engaged: engaged.length, rate }
  }, [logs])

  const missed = useMemo(
    () => results
      .filter((l) => (!l.userStatus || l.userStatus === 'NEW') && (l.realizedReturnRate ?? 0) > 0)
      .sort((a, b) => (b.realizedReturnRate ?? 0) - (a.realizedReturnRate ?? 0))
      .slice(0, 5),
    [results],
  )
  const followed = useMemo(
    () => results
      .filter((l) => l.userStatus === 'HELD' || l.userStatus === 'WATCHED')
      .sort((a, b) => (b.realizedReturnRate ?? 0) - (a.realizedReturnRate ?? 0))
      .slice(0, 5),
    [results],
  )

  return (
    <View style={{ gap: 14 }}>
      <MetricGrid metrics={metrics} participation={participation} palette={palette} />

      <Card
        palette={palette}
        title="놓친 픽"
        icon={<AlertCircle size={13} color={palette.orange} strokeWidth={2.5} />}
        meta={`${missed.length}건`}
      >
        {missed.length === 0 ? (
          <Text style={{ color: palette.inkMuted, fontSize: 12, paddingVertical: 12, textAlign: 'center' }}>
            놓친 픽 없음 — 잘 따라가고 있어
          </Text>
        ) : (
          <View style={{ gap: 4 }}>
            {missed.map((l) => <ResultRow key={`${l.date}-${l.ticker}`} log={l} palette={palette} onOpenDetail={onOpenDetail} />)}
          </View>
        )}
      </Card>

      <Card
        palette={palette}
        title="따라간 픽"
        icon={<Check size={13} color={palette.up} strokeWidth={2.5} />}
        meta={`${followed.length}건`}
      >
        {followed.length === 0 ? (
          <Text style={{ color: palette.inkMuted, fontSize: 12, paddingVertical: 12, textAlign: 'center' }}>
            AI 픽을 관심·보유로 추가하면 여기 실적이 쌓여
          </Text>
        ) : (
          <View style={{ gap: 4 }}>
            {followed.map((l) => <ResultRow key={`${l.date}-${l.ticker}`} log={l} palette={palette} onOpenDetail={onOpenDetail} />)}
          </View>
        )}
      </Card>

      <Card
        palette={palette}
        title="최근 결과 로그"
        icon={<BarChart3 size={13} color={palette.inkSub} strokeWidth={2.5} />}
        meta={`${results.length}건`}
      >
        {results.length === 0 ? (
          <Text style={{ color: palette.inkMuted, fontSize: 12, paddingVertical: 12, textAlign: 'center' }}>
            아직 실현 결과 없음
          </Text>
        ) : (
          <View style={{ gap: 4 }}>
            {results.slice(0, 12).map((l) => (
              <ResultRow key={`${l.date}-${l.ticker}-${l.stage}`} log={l} palette={palette} onOpenDetail={onOpenDetail} showDate />
            ))}
          </View>
        )}
      </Card>
    </View>
  )
}

function MetricGrid({
  metrics, participation, palette,
}: {
  metrics: RecommendationMetrics | null
  participation: { total: number; engaged: number; rate: number }
  palette: Palette
}) {
  const hitRate = metrics?.hitRate
  const avg = metrics?.averageReturnRate
  const windowLabel = metrics?.windowDays ? `최근 ${metrics.windowDays}일` : '전체'

  // 모바일: 2x2 grid via flex-wrap
  const tiles = [
    {
      title: '승률',
      value: hitRate == null ? '—' : `${Math.round(hitRate * 100)}%`,
      hint: metrics ? `${metrics.successCount}/${metrics.totalCount}건` : windowLabel,
      color: hitRate == null ? palette.inkSub : hitRate >= 0.5 ? palette.up : palette.down,
      Icon: Trophy,
    },
    {
      title: '평균 수익률',
      value: avg == null ? '—' : formatSignedRate(avg),
      hint: windowLabel,
      color: simpleDelta(avg, palette),
      Icon: BarChart3,
    },
    {
      title: '내 참여율',
      value: `${Math.round(participation.rate * 100)}%`,
      hint: `${participation.engaged}/${participation.total}건`,
      color: participation.rate >= 0.4 ? palette.up : palette.inkSub,
      Icon: Target,
    },
    {
      title: '최근 픽',
      value: metrics?.totalCount != null ? `${metrics.totalCount}건` : '—',
      hint: windowLabel,
      color: palette.purple,
      Icon: Clock,
    },
  ]

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {tiles.map((t) => (
        <View
          key={t.title}
          style={{
            // 2열 grid: width = (100% - 8gap) / 2. RN 은 % 계산이 까다로우니 minWidth 로.
            flexBasis: '48%',
            flexGrow: 1,
            backgroundColor: palette.surface,
            borderRadius: 12, borderWidth: 1, borderColor: palette.border,
            padding: 12, gap: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <t.Icon size={12} color={t.color} strokeWidth={2.5} />
            <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
              {t.title.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: t.color, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {t.value}
          </Text>
          <Text style={{ color: palette.inkMuted, fontSize: 10 }} numberOfLines={1}>
            {t.hint}
          </Text>
        </View>
      ))}
    </View>
  )
}

function ResultRow({
  log, palette, onOpenDetail, showDate,
}: {
  log: RecommendationExecutionLog
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
  showDate?: boolean
}) {
  const r = log.realizedReturnRate ?? 0
  const color = simpleDelta(r, palette)
  return (
    <Pressable
      onPress={() => { void hapticLight(); onOpenDetail(log.market, log.ticker, log.name) }}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 6, paddingVertical: 7, borderRadius: 6,
        backgroundColor: pressed ? palette.surfaceAlt : 'transparent',
      })}
    >
      {r >= 0
        ? <TrendingUp size={11} color={color} strokeWidth={2.5} />
        : <TrendingDown size={11} color={color} strokeWidth={2.5} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 12, fontWeight: '700' }}>{log.name}</Text>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
          {log.market} · {log.ticker}{showDate && log.date ? ` · ${log.date}` : ''}
        </Text>
      </View>
      <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 60, textAlign: 'right' }}>
        {formatSignedRate(r)}
      </Text>
    </Pressable>
  )
}

/* ── helper ────────────────────────────────────────────── */

function simpleDelta(value: number | null | undefined, palette: Palette) {
  if (value == null || Number.isNaN(value)) return palette.inkSub
  if (value > 0) return palette.up
  if (value < 0) return palette.down
  return palette.inkSub
}
