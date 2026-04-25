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
 */
import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Check,
  Clock,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react-native'
import type {
  AiRecommendationData,
  BriefingAction,
  MarketSummaryData,
  RecommendationExecutionLog,
  RecommendationMetrics,
  StockSearchResult,
  WatchItem,
} from '../types'
import { useTheme, type Palette } from '../theme'
import { formatSignedRate } from '../utils'
import { Widget, Sparkline, webGrid, deltaColor } from './shared'

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

/* ────────────────────────────────────────────────────────
 *    PLAYBOOK — 오늘의 플레이북
 * ──────────────────────────────────────────────────────── */

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
        meta={aiRecommendation?.summary ? null : null}
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
              지금 휴장 — 픽은 다음 거래일 후보 점검용으로만 봐. 진입가는 마감가 기준이라 다음 개장가에서 다시 잡아야 해.
            </Text>
          </View>
        ) : null}
        {todayPicks.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: 'center' }}>
            <Text style={{ color: palette.inkMuted, fontSize: 12 }}>AI 추천 준비 중</Text>
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
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 18,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Flame size={14} color={palette.orange} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
          TODAY · BRIEFING
        </Text>
        {slotLabel ? (
          <View style={{ backgroundColor: palette.blueSoft, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 }}>{slotLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: palette.ink, fontSize: 20, fontWeight: '800', lineHeight: 26 }}>
        {headline}
      </Text>
      {narrative ? (
        <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 19 }}>
          {narrative}
        </Text>
      ) : null}
      {briefing?.context ? (
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
          {briefing.context.holdingPnlLabel ? (
            <ContextPill
              label="내 포지션"
              value={briefing.context.holdingPnlLabel}
              color={briefing.context.holdingPnlRate == null ? palette.inkSub : briefing.context.holdingPnlRate >= 0 ? palette.up : palette.down}
              palette={palette}
            />
          ) : null}
          {briefing.context.watchlistAlertCount > 0 ? (
            <ContextPill
              label="감시 알림"
              value={`${briefing.context.watchlistAlertCount}건`}
              color={palette.orange}
              palette={palette}
            />
          ) : null}
          {briefing.context.marketMood ? (
            <ContextPill
              label="시장 분위기"
              value={briefing.context.marketMood}
              color={palette.purple}
              palette={palette}
            />
          ) : null}
          {briefing.context.keyEvent ? (
            <ContextPill
              label="핵심 이벤트"
              value={briefing.context.keyEvent}
              color={palette.teal}
              palette={palette}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

function ContextPill({ label, value, color, palette }: { label: string; value: string; color: string; palette: Palette }) {
  return (
    <View style={{ flexDirection: 'column', gap: 2 }}>
      <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color, fontSize: 13, fontWeight: '800' }}>{value}</Text>
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
  const onPress = clickable ? () => onOpenDetail(action.market!, action.ticker!, action.title) : undefined

  return (
    <Pressable
      onPress={onPress}
      disabled={!clickable}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          backgroundColor: hovered && clickable ? palette.surfaceAlt : palette.bg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: hovered && clickable ? priColor : palette.border,
          padding: 12,
          gap: 6,
        }]
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ backgroundColor: priSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: priColor, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>{priLabel}</Text>
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 }}>
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
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
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
      onPress={() => onOpenDetail(log.market, log.ticker, log.name)}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          backgroundColor: hovered ? palette.surfaceAlt : palette.bg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: hovered ? palette.blue : palette.border,
          padding: 12,
          gap: 6,
        }]
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>
          {log.market}
        </Text>
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>
          {log.ticker}
        </Text>
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
      <Text numberOfLines={2} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15, minHeight: 30 }}>
        {log.rationale || '—'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {log.confidence != null ? (
          <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800' }}>
            확신 {Math.round(log.confidence * 100)}%
          </Text>
        ) : null}
        {exp != null ? (
          <Text style={{ color: deltaColor(exp, palette), fontSize: 10, fontWeight: '800' }}>
            기대 {formatSignedRate(exp)}
          </Text>
        ) : null}
        <View style={{ flex: 1 }} />
      </View>
      {log.entryPrice != null && !marketClosed ? (
        <View style={{ flexDirection: 'row', gap: 12, paddingTop: 6, borderTopWidth: 1, borderTopColor: palette.border }}>
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
              setAdding(true)
              try { await onQuickAdd() } finally { setAdding(false) }
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              backgroundColor: palette.blueSoft, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3,
            }}
          >
            <Plus size={10} color={palette.blue} strokeWidth={3} />
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '800' }}>
              {adding ? '추가 중…' : '관심 추가'}
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
      <Text style={{ color, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {value.toLocaleString('ko-KR')}
      </Text>
    </View>
  )
}

/* ────────────────────────────────────────────────────────
 *    SCORECARD — AI 성적표
 * ──────────────────────────────────────────────────────── */

function Scorecard({
  aiRecommendation, palette, onOpenDetail,
}: {
  aiRecommendation: AiRecommendationData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const metrics = aiRecommendation?.metrics ?? null
  const logs = aiRecommendation?.executionLogs ?? []

  // 결과 로그 (RESULT 스테이지 + realizedReturnRate 있는 것)
  const results = useMemo(
    () => logs.filter((l) => l.realizedReturnRate != null),
    [logs],
  )
  // 사용자 참여율
  const participation = useMemo(() => {
    const recs = logs.filter((l) => l.stage?.toUpperCase().includes('RECOMMEND'))
    const engaged = recs.filter((l) => l.userStatus === 'HELD' || l.userStatus === 'WATCHED')
    const rate = recs.length === 0 ? 0 : engaged.length / recs.length
    return { total: recs.length, engaged: engaged.length, rate }
  }, [logs])

  // "놓친 픽" — userStatus 없거나 NEW 인데 실현수익 양수
  const missed = useMemo(
    () => results
      .filter((l) => (!l.userStatus || l.userStatus === 'NEW') && (l.realizedReturnRate ?? 0) > 0)
      .sort((a, b) => (b.realizedReturnRate ?? 0) - (a.realizedReturnRate ?? 0))
      .slice(0, 5),
    [results],
  )
  // "따라간 픽" — HELD/WATCHED
  const followed = useMemo(
    () => results
      .filter((l) => l.userStatus === 'HELD' || l.userStatus === 'WATCHED')
      .sort((a, b) => (b.realizedReturnRate ?? 0) - (a.realizedReturnRate ?? 0))
      .slice(0, 5),
    [results],
  )

  // 수익률 트렌드 (최신→과거 순 → 역순으로 스파크라인)
  const trendPoints = useMemo(() => {
    const pts = [...results]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map((l) => (l.realizedReturnRate ?? 0) * 100)
    return pts
  }, [results])

  return (
    <View style={{ gap: 14 }}>
      <MetricCards metrics={metrics} participation={participation} trendPoints={trendPoints} palette={palette} />

      <View style={[{ gap: 14 }, webGrid('minmax(0, 1fr) minmax(0, 1fr)')]}>
        <Widget
          palette={palette}
          title="놓친 픽"
          icon={<AlertCircle size={13} color={palette.orange} strokeWidth={2.5} />}
          meta={`${missed.length}건 · 관심 안 넣었지만 올랐음`}
        >
          {missed.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>놓친 픽 없음 — 잘 따라가고 있어</Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {missed.map((l) => <ResultRow key={`${l.date}-${l.ticker}`} log={l} palette={palette} onOpenDetail={onOpenDetail} />)}
            </View>
          )}
        </Widget>

        <Widget
          palette={palette}
          title="따라간 픽"
          icon={<Check size={13} color={palette.up} strokeWidth={2.5} />}
          meta={`${followed.length}건`}
        >
          {followed.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ color: palette.inkMuted, fontSize: 12 }}>AI 픽을 관심/보유로 추가하면 여기 실적이 쌓여</Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {followed.map((l) => <ResultRow key={`${l.date}-${l.ticker}`} log={l} palette={palette} onOpenDetail={onOpenDetail} />)}
            </View>
          )}
        </Widget>
      </View>

      <RecentResultsTable results={results.slice(0, 20)} palette={palette} onOpenDetail={onOpenDetail} />
    </View>
  )
}

function MetricCards({
  metrics, participation, trendPoints, palette,
}: {
  metrics: RecommendationMetrics | null
  participation: { total: number; engaged: number; rate: number }
  trendPoints: number[]
  palette: Palette
}) {
  const hitRate = metrics?.hitRate
  const avg = metrics?.averageReturnRate
  const best = metrics?.bestReturnRate
  const worst = metrics?.worstReturnRate
  const windowLabel = metrics?.windowDays ? `최근 ${metrics.windowDays}일` : '전체'

  return (
    <View style={[{ gap: 14 }, webGrid('repeat(auto-fit, minmax(200px, 1fr))')]}>
      <MetricCard
        title="승률"
        value={hitRate == null ? '—' : `${Math.round(hitRate * 100)}%`}
        hint={metrics ? `${metrics.successCount}/${metrics.totalCount}건 · ${windowLabel}` : '데이터 없음'}
        color={hitRate == null ? palette.inkSub : hitRate >= 0.5 ? palette.up : palette.down}
        icon={<Trophy size={14} strokeWidth={2.5} />}
        palette={palette}
      />
      <MetricCard
        title="평균 수익률"
        value={avg == null ? '—' : formatSignedRate(avg)}
        hint={best != null && worst != null ? `최고 ${formatSignedRate(best)} · 최저 ${formatSignedRate(worst)}` : windowLabel}
        color={deltaColor(avg, palette)}
        icon={<BarChart3 size={14} strokeWidth={2.5} />}
        palette={palette}
        trend={trendPoints}
      />
      <MetricCard
        title="내 참여율"
        value={`${Math.round(participation.rate * 100)}%`}
        hint={`${participation.engaged}/${participation.total}건 관심·보유`}
        color={participation.rate >= 0.4 ? palette.up : palette.inkSub}
        icon={<Target size={14} strokeWidth={2.5} />}
        palette={palette}
      />
      <MetricCard
        title="최근 픽"
        value={metrics?.totalCount != null ? `${metrics.totalCount}건` : '—'}
        hint={windowLabel}
        color={palette.purple}
        icon={<Clock size={14} strokeWidth={2.5} />}
        palette={palette}
      />
    </View>
  )
}

function MetricCard({
  title, value, hint, color, icon, palette, trend,
}: {
  title: string; value: string; hint: string; color: string
  icon: React.ReactElement; palette: Palette; trend?: number[]
}) {
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 14,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {React.cloneElement(icon, { color } as any)}
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
          {title.toUpperCase()}
        </Text>
      </View>
      <Text style={{ color, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text style={{ color: palette.inkMuted, fontSize: 11 }} numberOfLines={1}>
        {hint}
      </Text>
      {trend && trend.length > 1 ? (
        <Sparkline points={trend} width={180} height={28} palette={palette} />
      ) : null}
    </View>
  )
}

function ResultRow({
  log, palette, onOpenDetail,
}: {
  log: RecommendationExecutionLog
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const r = log.realizedReturnRate ?? 0
  const color = deltaColor(r, palette)
  return (
    <Pressable
      onPress={() => onOpenDetail(log.market, log.ticker, log.name)}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 8, paddingVertical: 7, borderRadius: 7,
          backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
        }]
      }}
    >
      {r >= 0
        ? <TrendingUp size={11} color={color} strokeWidth={2.5} />
        : <TrendingDown size={11} color={color} strokeWidth={2.5} />}
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}>
        {log.name}
      </Text>
      <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
        {log.market} · {log.ticker}
      </Text>
      <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 60, textAlign: 'right' }}>
        {formatSignedRate(r)}
      </Text>
    </Pressable>
  )
}

function RecentResultsTable({
  results, palette, onOpenDetail,
}: {
  results: RecommendationExecutionLog[]
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  return (
    <Widget
      palette={palette}
      title="최근 결과 로그"
      icon={<BarChart3 size={13} color={palette.inkSub} strokeWidth={2.5} />}
      meta={`${results.length}건`}
    >
      {results.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>아직 실현 결과 없음</Text>
        </View>
      ) : (
        <View>
          <View style={{
            flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6,
            borderBottomWidth: 1, borderBottomColor: palette.border, gap: 8,
          }}>
            <Text style={{ flex: 2, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>종목</Text>
            <Text style={{ width: 70, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>날짜</Text>
            <Text style={{ width: 70, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>상태</Text>
            <Text style={{ width: 80, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' }}>기대</Text>
            <Text style={{ width: 80, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' }}>실현</Text>
            <Text style={{ width: 60, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' }}>내 선택</Text>
          </View>
          {results.map((l) => {
            const exp = l.expectedReturnRate
            const rea = l.realizedReturnRate
            return (
              <Pressable
                key={`${l.date}-${l.market}-${l.ticker}-${l.stage}`}
                onPress={() => onOpenDetail(l.market, l.ticker, l.name)}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, gap: 8,
                    backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  }]
                }}
              >
                <View style={{ flex: 2, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>
                    {l.name}
                  </Text>
                  <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
                    {l.market} · {l.ticker}
                  </Text>
                </View>
                <Text style={{ width: 70, color: palette.inkSub, fontSize: 11, fontWeight: '600' }}>{l.date}</Text>
                <Text style={{ width: 70, color: palette.inkMuted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                  {l.status}
                </Text>
                <Text style={{ width: 80, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right', color: deltaColor(exp, palette) }}>
                  {exp == null ? '—' : formatSignedRate(exp)}
                </Text>
                <Text style={{ width: 80, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], textAlign: 'right', color: deltaColor(rea, palette) }}>
                  {rea == null ? '—' : formatSignedRate(rea)}
                </Text>
                <View style={{ width: 60, alignItems: 'flex-end', justifyContent: 'center' }}>
                  {l.userStatus && l.userStatus !== 'NEW' ? (
                    <View style={{ backgroundColor: palette.blueSoft, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ color: palette.blue, fontSize: 9, fontWeight: '800' }}>{l.userStatus}</Text>
                    </View>
                  ) : (
                    <Text style={{ color: palette.inkFaint, fontSize: 10 }}>—</Text>
                  )}
                </View>
              </Pressable>
            )
          })}
        </View>
      )}
    </Widget>
  )
}
