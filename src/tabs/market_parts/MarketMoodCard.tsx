import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Info, Thermometer, X } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { CompositeRiskSignal, SummaryMetric } from '../../types'
import { getRiskScoreColor } from '../../utils'

type MarketPref = 'KR' | 'US' | 'BOTH'

type Props = {
  krRisk: CompositeRiskSignal | null
  usRisk: CompositeRiskSignal | null
  metrics: SummaryMetric[]
  marketPreference: MarketPref
}

/**
 * 오늘 시장 분위기 — 한국/미국 투자자 관점으로 분리한 위험도.
 * 시장 선호가 BOTH 면 KR/US 탭으로 전환, KR/US 면 해당 시장만 노출.
 * 위험도(hero) + 시장별 구성요소·요약 지표를 하나로 묶고 어려운 용어는 쉬운 말로 바꿔 보여준다.
 */

// 어려운 지표명 → 쉬운 말. 백엔드 라벨을 화면에서만 친근하게 치환.
const FRIENDLY_LABEL: Record<string, string> = {
  'PizzINT 종합': '시장 신호 종합',
  PizzINT: '시장 신호 종합',
  'CBOE VIX': '美 변동성(VIX)',
  'VIX 변동성': '美 변동성(VIX)',
  VIX: '美 변동성(VIX)',
  '한국 지수 변동': '한국 지수 변동',
  '뉴스 키워드': '뉴스 위험도',
  'Fear Meter': '공포·탐욕',
  'KR Heat': '한국 강도',
  'US Heat': '미국 강도',
  'KR Overheat': '한국 과열도',
  'Flow Bias': '외국인·기관 수급',
}

// 위험도(높을수록 나쁨)가 아니라 '강도/모멘텀'(50=중립, 높을수록 강세)인 지표.
// 같은 0~100 바라도 색·해석 축이 달라 구분 표시한다.
const MOMENTUM_LABELS = new Set(['한국 강도', '미국 강도'])
const friendly = (label: string) => FRIENDLY_LABEL[label] ?? FRIENDLY_LABEL[label.trim()] ?? label

// 요약 지표가 어느 시장 소속인지 — 선택 탭에 맞는 것만 노출.
const METRIC_MARKET: Record<string, 'KR' | 'US'> = {
  'Fear Meter': 'US',
  'US Heat': 'US',
  'KR Heat': 'KR',
  'KR Overheat': 'KR',
  'Flow Bias': 'KR',
}

// 미세미세 스타일 5단계 — 위험도(0~100, 높을수록 위험)별 이모지·색·직설 가이드.
// 백엔드 level(안정/관망/주의/경계/고위험)에 1:1 매핑해 라벨 일관 유지.
type MiseLevel = { emoji: string; action: string; color: string; bg: string }
const MISE: Record<string, MiseLevel> = {
  안정: { emoji: '😎', action: '진입하기 무난한 날 — 계획대로 진행하세요', color: '#15803d', bg: '#dcfce7' },
  관망: { emoji: '🙂', action: '평소 페이스 유지 — 무리한 추격만 피하면 돼요', color: '#0d9488', bg: '#d1fae5' },
  주의: { emoji: '😐', action: '분할·소액으로 신중하게 — 손절선 먼저 정해두세요', color: '#b45309', bg: '#fef3c7' },
  경계: { emoji: '😟', action: '신규 진입은 자제 — 보유 비중·리스크부터 점검', color: '#c2410c', bg: '#ffedd5' },
  고위험: { emoji: '😱', action: '지금은 쉬어가기 — 진입 보류, 현금·관리 우선', color: '#b91c1c', bg: '#fee2e2' },
}
const miseOf = (level: string): MiseLevel => MISE[level] ?? MISE['주의']

type Indicator = { label: string; score: number; state: string; detail: string; momentum?: boolean }

export function MarketMoodCard({ krRisk, usRisk, metrics, marketPreference }: Props) {
  const styles = useStyles()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'KR' | 'US'>('KR')

  const showKr = marketPreference !== 'US'
  const showUs = marketPreference !== 'KR'
  const bothShown = showKr && showUs
  // 선호가 한쪽이면 그쪽 고정, BOTH 면 탭 상태를 따른다.
  const activeTab: 'KR' | 'US' = !showKr ? 'US' : !showUs ? 'KR' : tab
  const risk = activeTab === 'KR' ? krRisk : usRisk

  // 세부 지표 통합 — 위험도 구성요소 우선, 겹치지 않는 요약 지표(선택 시장 소속)를 뒤에.
  const indicators: Indicator[] = []
  const seen = new Set<string>()
  for (const c of risk?.components ?? []) {
    const label = friendly(c.label)
    if (seen.has(label)) continue
    seen.add(label)
    indicators.push({ label, score: c.score, state: c.state, detail: c.detail })
  }
  for (const m of metrics) {
    if ((METRIC_MARKET[m.label] ?? activeTab) !== activeTab) continue
    const label = friendly(m.label)
    if (seen.has(label)) continue
    seen.add(label)
    indicators.push({ label, score: m.score, state: m.state, detail: m.note, momentum: MOMENTUM_LABELS.has(label) })
  }

  if (!risk && indicators.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Thermometer size={14} color="#f59e0b" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>오늘 시장 분위기</Text>
          </View>
        </View>
        <View style={styles.riskEmptyBox}>
          <Text style={styles.metaText}>분위기 분석을 준비하고 있습니다</Text>
        </View>
      </View>
    )
  }

  const mise = risk ? miseOf(risk.level) : null
  const asOf = risk?.asOf?.slice(0, 16).replace('T', ' ') ?? ''

  return (
    <>
      <Pressable
        onPress={() => risk && setOpen(true)}
        disabled={!risk}
        style={({ pressed }) => [styles.card, pressed && risk ? { opacity: 0.7 } : null]}
      >
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Thermometer size={14} color={mise?.color ?? '#f59e0b'} strokeWidth={2.5} />
            <Text style={styles.cardTitle}>오늘 시장 분위기</Text>
          </View>
          {risk ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.metaText}>탭하면 설명</Text>
              <Info size={12} color="#94a3b8" strokeWidth={2} />
            </View>
          ) : null}
        </View>

        {/* KR/US 탭 — 시장 선호가 BOTH 일 때만 노출 */}
        {bothShown ? (
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 2 }}>
            {(['KR', 'US'] as const).map((m) => {
              const active = activeTab === m
              return (
                <Pressable
                  key={m}
                  onPress={() => setTab(m)}
                  accessibilityRole="button"
                  accessibilityLabel={m === 'KR' ? '한국 시장 분위기' : '미국 시장 분위기'}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
                    backgroundColor: active ? '#2563eb22' : 'transparent',
                    borderWidth: 1, borderColor: active ? '#2563eb' : '#3341552a',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#2563eb' : '#94a3b8' }}>
                    {m === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}

        {risk && mise ? (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 13,
            backgroundColor: mise.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
            marginTop: 4, marginBottom: 2,
          }}>
            <Text style={{ fontSize: 42 }}>{mise.emoji}</Text>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: mise.color, fontVariant: ['tabular-nums'] }}>{risk.score100}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: mise.color, opacity: 0.6, marginLeft: 2 }}>/100</Text>
                <Text style={{ fontSize: 17, fontWeight: '900', color: mise.color, marginLeft: 8 }}>{risk.level}</Text>
              </View>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#475569', lineHeight: 17 }}>{mise.action}</Text>
            </View>
          </View>
        ) : null}

        {indicators.map((ind) => (
          <IndicatorRow key={ind.label} indicator={ind} />
        ))}

        {risk?.personalImpact ? <Text style={styles.riskPersonalImpact}>{risk.personalImpact}</Text> : null}

        <Text style={styles.riskFootnote}>한국·미국 시장을 각각 변동성·뉴스로 종합한 참고 지표입니다</Text>
      </Pressable>

      {risk ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.signalModalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.signalModalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.signalModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.signalModalTitle}>
                    {activeTab === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'} 시장 분위기 {risk.score100}/100
                  </Text>
                  <Text style={styles.signalModalSubtitle}>{mise?.emoji} {risk.level} · 위험할수록 100에 가까움</Text>
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
                  <Text style={styles.signalModalSectionTitle}>어떻게 계산합니까?</Text>
                  <Text style={styles.signalModalBody}>{risk.methodology}</Text>
                </View>

                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>지금 보고 있는 지표</Text>
                  {risk.components.map((c) => (
                    <Text key={c.label} style={styles.signalModalBody}>
                      · {friendly(c.label)} (비중 {Math.round(c.weight * 100)}%) — {c.score}/100, {c.state}
                    </Text>
                  ))}
                </View>

                <Text style={styles.signalModalDisclaimer}>
                  시장 분위기는 참고용 보조 신호입니다. 이것만으로 매매하지 말고 가격·수급·뉴스랑 같이 봐 주세요.
                  {'\n'}기준 시각 {asOf}
                </Text>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  )
}

// 강도/모멘텀 색축: 50=중립, 높을수록 강세(초록)·낮을수록 약세(빨강). 위험도(getRiskScoreColor)와 반대.
function momentumColor(score: number) {
  if (score >= 60) return '#16a34a'
  if (score <= 40) return '#dc2626'
  return '#d97706'
}

function IndicatorRow({ indicator }: { indicator: Indicator }) {
  const styles = useStyles()
  const color = indicator.momentum ? momentumColor(indicator.score) : getRiskScoreColor(indicator.score)
  const pct = Math.max(0, Math.min(100, indicator.score))
  return (
    <View style={styles.riskComponentRow}>
      <View style={styles.riskComponentHead}>
        <Text style={[styles.riskComponentLabel, { flex: 1 }]} numberOfLines={1}>
          {indicator.label}{indicator.momentum ? ' · 50중립' : ''}
        </Text>
        <Text style={[styles.riskComponentScore, { color }]}>{Math.round(indicator.score)}</Text>
      </View>
      <View style={styles.riskTrack}>
        <View style={[styles.riskTrackFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.riskComponentDetail} numberOfLines={2}>
        <Text style={[styles.riskComponentState, { color }]}>{indicator.state}</Text>
        {indicator.detail ? ` · ${indicator.detail}` : ''}
      </Text>
    </View>
  )
}
