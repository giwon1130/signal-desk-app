import { Text, View } from 'react-native'
import { ShieldAlert } from 'lucide-react-native'
import type { MarketSummaryData, RiskComponent } from '../../types'
import { type Palette } from '../../theme'
import { Widget } from '../shared'

/**
 * `compositeRisk` — PizzINT 종합 / VIX / 뉴스 키워드를 가중 합성한 1~10 시장 위험도.
 * 기존 개별 대체 시그널 위젯을 대체한다.
 */
export function CompositeRiskWidget({ summary, palette }: { summary: MarketSummaryData | null; palette: Palette }) {
  const risk = summary?.compositeRisk ?? null
  if (!risk) {
    return (
      <Widget palette={palette} title="종합 위험도" icon={<ShieldAlert size={13} color={palette.orange} strokeWidth={2.5} />}>
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>위험도 분석 준비 중</Text>
        </View>
      </Widget>
    )
  }
  const accent = risk.score >= 8 ? palette.down : risk.score >= 5 ? palette.orange : palette.up
  return (
    <Widget
      palette={palette}
      title="종합 위험도"
      icon={<ShieldAlert size={13} color={accent} strokeWidth={2.5} />}
      meta={risk.level}
    >
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ color: accent, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {risk.score}
          </Text>
          <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '700' }}>/ 10</Text>
        </View>
        <Text style={{ color: palette.inkSub, fontSize: 11, lineHeight: 16 }} numberOfLines={3}>
          {risk.headline}
        </Text>
        <View style={{ gap: 8 }}>
          {risk.components.map((component) => (
            <RiskRow key={component.label} component={component} palette={palette} />
          ))}
        </View>
      </View>
    </Widget>
  )
}

function RiskRow({ component, palette }: { component: RiskComponent; palette: Palette }) {
  const score = Math.max(0, Math.min(100, component.score))
  const color = score >= 67 ? palette.down : score >= 40 ? palette.orange : palette.up
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {component.label}
        </Text>
        <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700' }}>
          가중 {Math.round(component.weight * 100)}%
        </Text>
        <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{score}</Text>
      </View>
      <View style={{ height: 4, backgroundColor: palette.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${score}%`, height: '100%', backgroundColor: color }} />
      </View>
    </View>
  )
}
