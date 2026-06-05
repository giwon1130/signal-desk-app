import { Text, View } from 'react-native'
import { ShieldAlert } from 'lucide-react-native'
import type { MarketSummaryData, RiskComponent } from '../../types'
import { type Palette } from '../../theme'
import { Widget } from '../shared'

// 미세미세 스타일 5단계 — 위험도(0~100, 높을수록 위험)별 이모지·직설 가이드·색.
// 색은 라이트/다크 모두 무난한 중간톤 + 반투명 배경(color+'22').
const WEB_MISE: Record<string, { emoji: string; action: string; color: string }> = {
  안정: { emoji: '😎', action: '진입하기 무난한 날 — 계획대로 진행하세요', color: '#16a34a' },
  관망: { emoji: '🙂', action: '평소 페이스 유지 — 무리한 추격만 피하면 돼요', color: '#0d9488' },
  주의: { emoji: '😐', action: '분할·소액으로 신중하게 — 손절선 먼저 정해두세요', color: '#d97706' },
  경계: { emoji: '😟', action: '신규 진입은 자제 — 보유 비중·리스크부터 점검', color: '#ea580c' },
  고위험: { emoji: '😱', action: '지금은 쉬어가기 — 진입 보류, 현금·관리 우선', color: '#dc2626' },
}

/**
 * 오늘 시장 분위기 — VIX·한국 지수·환율·금리·뉴스를 가중 합성한 0~100 위험도.
 * 미세미세 앱처럼 이모지 + 5단계 + 직설 투자 가이드로 표시.
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
  const mise = WEB_MISE[risk.level] ?? WEB_MISE['주의']
  return (
    <Widget
      palette={palette}
      title="오늘 시장 분위기"
      icon={<ShieldAlert size={13} color={mise.color} strokeWidth={2.5} />}
      meta={risk.level}
    >
      <View style={{ gap: 10 }}>
        {/* 미세미세 히어로 — 이모지 + 0~100 점수 + 단계 + 직설 가이드 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          backgroundColor: mise.color + '22', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
        }}>
          <Text style={{ fontSize: 36 }}>{mise.emoji}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ color: mise.color, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{risk.score100}</Text>
              <Text style={{ color: mise.color, fontSize: 11, fontWeight: '800', opacity: 0.6, marginLeft: 2 }}>/100</Text>
              <Text style={{ color: mise.color, fontSize: 15, fontWeight: '900', marginLeft: 7 }}>{risk.level}</Text>
            </View>
            <Text style={{ color: palette.inkSub, fontSize: 11.5, fontWeight: '600', lineHeight: 16 }}>{mise.action}</Text>
          </View>
        </View>
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
