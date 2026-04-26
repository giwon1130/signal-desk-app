/**
 * AITab — 성적표 서브탭.
 * 메트릭 + 놓친 픽 + 따라간 픽 + 최근 결과 로그.
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
import type { Palette } from '../../theme'
import type {
  AiRecommendationData,
  RecommendationExecutionLog,
  RecommendationMetrics,
} from '../../types'
import { formatSignedRate } from '../../utils'
import { hapticLight } from '../../utils/haptics'
import { Card } from './Card'

export function Scorecard({
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

function simpleDelta(value: number | null | undefined, palette: Palette) {
  if (value == null || Number.isNaN(value)) return palette.inkSub
  if (value > 0) return palette.up
  if (value < 0) return palette.down
  return palette.inkSub
}
