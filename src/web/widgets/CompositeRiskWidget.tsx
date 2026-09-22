import { Text, View } from 'react-native'
import { ShieldAlert } from 'lucide-react-native'
import type { MarketSummaryData, RiskComponent } from '../../types'
import { type Palette } from '../../theme'
import { Widget } from '../shared'

// 합성 위험도별 참고 안내. 개별 종목의 매매 판단으로 표현하지 않는다.
// 색은 라이트/다크 모두 무난한 중간톤 + 반투명 배경(color+'22').
const WEB_MISE: Record<string, { action: string; color: string }> = {
  안정: { action: '일부 위험 지표가 낮습니다. 개별 종목의 변동 위험은 별도로 확인해 주세요.', color: '#16a34a' },
  관망: { action: '시장 지표의 방향이 뚜렷하지 않습니다. 주요 일정과 가격 변화를 함께 확인해 주세요.', color: '#0d9488' },
  주의: { action: '일부 위험 지표가 높아졌습니다. 변동성이 커질 수 있어 주의가 필요합니다.', color: '#d97706' },
  경계: { action: '시장 부담 요인이 커진 상태입니다. 보유 비중과 미리 정한 대응 기준을 점검해 주세요.', color: '#ea580c' },
  고위험: { action: '여러 위험 지표가 높은 상태입니다. 급격한 가격 변화와 자료의 최신 여부를 확인해 주세요.', color: '#dc2626' },
}

/** 서버가 계산한 합성 위험도와 구성 지표를 표시한다. */
export function CompositeRiskWidget({ summary, palette }: { summary: MarketSummaryData | null; palette: Palette }) {
  const risk = summary?.compositeRisk ?? null
  if (!risk) {
    return (
      <Widget palette={palette} title="시장 위험 지표" icon={<ShieldAlert size={13} color={palette.orange} strokeWidth={2.5} />}>
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>확인할 수 있는 위험 지표가 없습니다.</Text>
        </View>
      </Widget>
    )
  }
  const mise = WEB_MISE[risk.level] ?? WEB_MISE['주의']
  return (
    <Widget
      palette={palette}
      title="시장 위험 지표"
      icon={<ShieldAlert size={13} color={mise.color} strokeWidth={2.5} />}
      meta={risk.level}
    >
      <View style={{ gap: 10 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          backgroundColor: mise.color + '22', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
        }}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ color: mise.color, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{risk.score100}</Text>
              <Text style={{ color: mise.color, fontSize: 11, fontWeight: '800', opacity: 0.6, marginLeft: 2 }}>/100</Text>
              <Text style={{ color: mise.color, fontSize: 15, fontWeight: '900', marginLeft: 7 }}>{risk.level}</Text>
            </View>
            <Text style={{ color: palette.inkSub, fontSize: 11.5, fontWeight: '600', lineHeight: 16 }}>{mise.action}</Text>
          </View>
        </View>
        <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 17 }}>시장 전체의 참고 지표입니다. 매수 적합성이나 손실 가능성을 보장하지 않습니다.</Text>
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
