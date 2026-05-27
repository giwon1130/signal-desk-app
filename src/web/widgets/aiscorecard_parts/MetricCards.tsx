import React from 'react'
import { Text, View } from 'react-native'
import { BarChart3, Clock, Target, Trophy } from 'lucide-react-native'
import type { RecommendationMetrics } from '../../../types'
import { type Palette } from '../../../theme'
import { formatSignedRate } from '../../../utils'
import { Sparkline, webGrid, deltaColor } from '../../shared'

type Props = {
  metrics: RecommendationMetrics | null
  participation: { total: number; engaged: number; rate: number }
  trendPoints: number[]
  palette: Palette
}

/**
 * 성적표 상단 4종 메트릭 카드 — 승률 / 평균 수익률(스파크라인 포함) / 내 참여율 / 최근 픽 건수.
 */
export function MetricCards({ metrics, participation, trendPoints, palette }: Props) {
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
