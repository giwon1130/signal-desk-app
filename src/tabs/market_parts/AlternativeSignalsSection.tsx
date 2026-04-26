import { useState } from 'react'
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Info, X, Zap } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { AlternativeSignal } from '../../types'
import { getAlternativeSignalPalette, getMetricAccent } from '../../utils'

type Props = {
  signals: AlternativeSignal[]
}

export function AlternativeSignalsSection({ signals }: Props) {
  const styles = useStyles()
  const [activeSignal, setActiveSignal] = useState<AlternativeSignal | null>(null)
  return (
    <>
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Zap size={14} color="#f59e0b" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>실험 지표</Text>
          </View>
          <Text style={styles.metaText}>탭하면 설명 ·  {signals.length}개</Text>
        </View>
        {signals.map((item) => {
          const palette = getAlternativeSignalPalette(item.score)
          return (
            <Pressable
              key={item.label}
              onPress={() => setActiveSignal(item)}
              style={({ pressed }) => [
                styles.metricRow,
                styles.alternativeMetricRow,
                {
                  backgroundColor: palette.backgroundColor,
                  borderColor: palette.borderColor,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.metricLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.metricName}>{item.label}</Text>
                  <Info size={12} color="#94a3b8" strokeWidth={2} />
                </View>
                <Text style={styles.metricState}>{item.state}</Text>
              </View>
              <View style={styles.alternativeMetricTopRow}>
                <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score}</Text>
                <Text
                  style={[
                    styles.alternativeScoreBadge,
                    {
                      backgroundColor: palette.badgeBackgroundColor,
                      color: palette.badgeTextColor,
                    },
                  ]}
                >
                  {item.state}
                </Text>
              </View>
              <View style={styles.alternativeHighlightsRow}>
                {item.highlights.map((highlight) => (
                  <Text key={`${item.label}-${highlight}`} style={styles.alternativeHighlightChip}>
                    {highlight}
                  </Text>
                ))}
              </View>
              <Text style={styles.metricNote}>{item.note}</Text>
              {item.personalImpact ? (
                <Text style={styles.alternativePersonalImpact}>{item.personalImpact}</Text>
              ) : null}
              <Text style={styles.metricSource}>{item.source} · Experimental</Text>
            </Pressable>
          )
        })}
      </View>

      <Modal
        visible={activeSignal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveSignal(null)}
      >
        <Pressable style={styles.signalModalBackdrop} onPress={() => setActiveSignal(null)}>
          <Pressable style={styles.signalModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.signalModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.signalModalTitle}>{activeSignal?.label}</Text>
                <Text style={styles.signalModalSubtitle}>{activeSignal?.state} · 점수 {activeSignal?.score}</Text>
              </View>
              <Pressable onPress={() => setActiveSignal(null)} hitSlop={12}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {activeSignal?.description ? (
                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>이게 뭐야?</Text>
                  <Text style={styles.signalModalBody}>{activeSignal.description}</Text>
                </View>
              ) : null}

              {activeSignal?.methodology ? (
                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>점수 계산 방식</Text>
                  <Text style={styles.signalModalBody}>{activeSignal.methodology}</Text>
                </View>
              ) : null}

              <View style={styles.signalModalSection}>
                <Text style={styles.signalModalSectionTitle}>지금 관측치</Text>
                <Text style={styles.signalModalBody}>{activeSignal?.note}</Text>
                <View style={[styles.alternativeHighlightsRow, { marginTop: 8 }]}>
                  {(activeSignal?.highlights ?? []).map((h) => (
                    <Text key={h} style={styles.alternativeHighlightChip}>{h}</Text>
                  ))}
                </View>
              </View>

              <View style={styles.signalModalSection}>
                <Text style={styles.signalModalSectionTitle}>데이터 출처</Text>
                <Text style={styles.signalModalBody}>{activeSignal?.source}</Text>
                {activeSignal?.url ? (
                  <Pressable onPress={() => activeSignal.url && void Linking.openURL(activeSignal.url)}>
                    <Text style={styles.signalModalLink}>{activeSignal.url}</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.signalModalDisclaimer}>
                실험 지표는 보조 신호일 뿐이야. 단독으로 매매 근거로 쓰지 말고 다른 시그널이랑 같이 봐.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
