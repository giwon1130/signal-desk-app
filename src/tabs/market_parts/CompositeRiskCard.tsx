import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Info, ShieldAlert, X } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { CompositeRiskSignal, RiskComponent } from '../../types'
import { getCompositeRiskPalette, getRiskScoreColor } from '../../utils'

type Props = {
  risk: CompositeRiskSignal | null
}

/**
 * 합성 위험도 카드 — PizzINT 종합 / VIX / 뉴스 키워드를 가중 합성한 1~10 단일 지표.
 * 개별 실험 지표 카드를 대체한다.
 */
export function CompositeRiskCard({ risk }: Props) {
  const styles = useStyles()
  const [open, setOpen] = useState(false)

  if (!risk) {
    return (
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <ShieldAlert size={14} color="#f59e0b" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>종합 위험도</Text>
          </View>
        </View>
        <View style={styles.riskEmptyBox}>
          <Text style={styles.metaText}>위험도 분석 준비 중</Text>
        </View>
      </View>
    )
  }

  const palette = getCompositeRiskPalette(risk.score)
  const asOf = risk.asOf.slice(0, 16).replace('T', ' ')

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <ShieldAlert size={14} color={palette.accent} strokeWidth={2.5} />
            <Text style={styles.cardTitle}>종합 위험도</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.metaText}>탭하면 설명</Text>
            <Info size={12} color="#94a3b8" strokeWidth={2} />
          </View>
        </View>

        <View style={styles.riskHeroRow}>
          <View
            style={[
              styles.riskScoreBox,
              { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
            ]}
          >
            <Text style={[styles.riskScoreValue, { color: palette.accent }]}>{risk.score}</Text>
            <Text style={[styles.riskScoreOutOf, { color: palette.accent }]}>/ 10</Text>
            <Text
              style={[
                styles.riskLevelBadge,
                { backgroundColor: palette.badgeBackgroundColor, color: palette.badgeTextColor },
              ]}
            >
              {risk.level}
            </Text>
          </View>
          <Text style={styles.riskHeadline}>{risk.headline}</Text>
        </View>

        {risk.components.map((component) => (
          <RiskComponentRow key={component.label} component={component} />
        ))}

        {risk.personalImpact ? (
          <Text style={styles.riskPersonalImpact}>{risk.personalImpact}</Text>
        ) : null}

        <Text style={styles.riskFootnote}>PizzINT · CBOE VIX · Google News 종합 · Experimental</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.signalModalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.signalModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.signalModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.signalModalTitle}>종합 위험도 {risk.score}/10</Text>
                <Text style={styles.signalModalSubtitle}>
                  {risk.level} · 내부 점수 {risk.score100}/100
                </Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              <View style={styles.signalModalSection}>
                <Text style={styles.signalModalSectionTitle}>이게 무엇입니까?</Text>
                <Text style={styles.signalModalBody}>{risk.description}</Text>
              </View>

              <View style={styles.signalModalSection}>
                <Text style={styles.signalModalSectionTitle}>점수 계산 방식</Text>
                <Text style={styles.signalModalBody}>{risk.methodology}</Text>
              </View>

              <View style={styles.signalModalSection}>
                <Text style={styles.signalModalSectionTitle}>지금 구성요소</Text>
                {risk.components.map((component) => (
                  <Text key={component.label} style={styles.signalModalBody}>
                    · {component.label} (가중 {Math.round(component.weight * 100)}%) —{' '}
                    {component.score}/100, {component.state}
                  </Text>
                ))}
              </View>

              <Text style={styles.signalModalDisclaimer}>
                합성 위험도는 보조 신호일 뿐입니다. 단독 매매 근거로 쓰지 말고 가격·수급·뉴스랑 같이 봐 주세요.
                {'\n'}기준 시각 {asOf}
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

function RiskComponentRow({ component }: { component: RiskComponent }) {
  const styles = useStyles()
  const color = getRiskScoreColor(component.score)
  const pct = Math.max(0, Math.min(100, component.score))
  return (
    <View style={styles.riskComponentRow}>
      <View style={styles.riskComponentHead}>
        <Text style={[styles.riskComponentLabel, { flex: 1 }]} numberOfLines={1}>
          {component.label}
        </Text>
        <Text style={styles.riskComponentWeight}>가중 {Math.round(component.weight * 100)}%</Text>
        <Text style={[styles.riskComponentScore, { color }]}>{component.score}</Text>
      </View>
      <View style={styles.riskTrack}>
        <View style={[styles.riskTrackFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.riskComponentDetail} numberOfLines={2}>
        <Text style={[styles.riskComponentState, { color }]}>{component.state}</Text> · {component.detail}
      </Text>
    </View>
  )
}
