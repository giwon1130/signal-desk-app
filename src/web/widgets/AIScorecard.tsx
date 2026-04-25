/**
 * AI 워크스페이스 — 성적표 (Scorecard 서브탭).
 * AIWorkspace.tsx 에서 분리 (동작 동일).
 */
import React, { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import {
  AlertCircle,
  BarChart3,
  Check,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react-native'
import type {
  AiRecommendationData,
  RecommendationExecutionLog,
  RecommendationMetrics,
} from '../../types'
import { type Palette } from '../../theme'
import { formatSignedRate } from '../../utils'
import { Widget, Sparkline, webGrid, deltaColor } from '../shared'

export function Scorecard({
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
