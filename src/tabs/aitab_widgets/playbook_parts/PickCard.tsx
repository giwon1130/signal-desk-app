import { useState } from 'react'
import { Pressable, Share, Text, View } from 'react-native'
import { AlertTriangle, ArrowUpRight, Check, ChevronDown, ChevronUp, Plus, Share2 } from 'lucide-react-native'
import type { AiPick } from '../../../types'
import { marketColor, type Palette } from '../../../theme'
import { formatSignedRate } from '../../../utils'
import { hapticLight } from '../../../utils/haptics'
import { canReviewPick, isPickSnapshotStale, PICK_DECISION_LABELS } from '../../../utils/pickReview'
import { buildTradePlanShareText, formatTradePlanPrice, isTradePlanExpired, tradePlanRiskLabel } from '../../../utils/tradePlan'

type Props = {
  pick: AiPick
  palette: Palette
  generatedAt?: string
  now?: number
  inWatch: boolean
  onOpenDetail: (m: string, t: string, n?: string) => void
  onQuickAdd: () => Promise<void>
}

/** AI 의견과 규칙 기반 검토 결과를 구분한다. 모델 확신도를 수익 확률로 표시하지 않는다. */
export function PickCard({ pick, palette, generatedAt, now = Date.now(), inWatch, onOpenDetail, onQuickAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const assessment = pick.assessment
  const stale = isPickSnapshotStale(generatedAt, now)
  const plan = pick.tradePlan
  const expired = !plan || isTradePlanExpired(plan, new Date(now))
  const reviewable = canReviewPick(pick, generatedAt, now)
  const hasPlan = !!plan && assessment?.decision === 'REVIEW'
  const canShare = reviewable && !expired && plan?.executable === false
  const tone = stale ? palette.orange : assessment?.decision === 'REVIEW' ? palette.teal
    : assessment?.decision === 'AVOID' ? palette.red
    : assessment?.decision === 'WATCH' ? palette.orange : palette.inkMuted
  const statusLabel = stale ? '갱신 필요'
    : assessment ? PICK_DECISION_LABELS[assessment.decision] ?? '검증 전' : '검증 전 · AI 의견'

  const sharePlan = async () => {
    // 탭을 오래 열어두거나 공유 직전 만료되는 경우도 다시 확인한다.
    if (!canReviewPick(pick, generatedAt)) return
    const message = buildTradePlanShareText(pick)
    if (!message) return
    try {
      setActionError(null)
      await Share.share({ message, title: pick.name + ' 검토 계획' })
    } catch { setActionError('공유를 열지 못했어. 잠시 뒤 다시 시도해봐.') }
  }

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
      <View style={{ height: 3, backgroundColor: tone }} />
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ borderRadius: 6, backgroundColor: tone + '16', paddingHorizontal: 8, paddingVertical: 5 }}>
            <Text style={{ color: tone, fontSize: 11, fontWeight: '800' }}>{statusLabel}</Text>
          </View>
          <Text style={{ flex: 1, textAlign: 'right', color: palette.inkMuted, fontSize: 11 }}>{pick.market} · {pick.ticker}</Text>
        </View>
        <Pressable
          onPress={() => { void hapticLight(); onOpenDetail(pick.market, pick.ticker, pick.name) }}
          accessibilityRole="button"
          accessibilityLabel={pick.name + ' 종목 상세 보기'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}
        >
          <Text style={{ flex: 1, color: palette.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.6 }}>{pick.name}</Text>
          <ArrowUpRight size={20} color={palette.inkMuted} />
        </Pressable>
        {(Number.isFinite(pick.changeRate) || pick.flowTag) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {pick.changeRate != null && Number.isFinite(pick.changeRate) ? (
              <Text style={{ color: marketColor(palette, pick.market, pick.changeRate), fontSize: 13, fontWeight: '800' }}>
                당일 {formatSignedRate(pick.changeRate)}
              </Text>
            ) : null}
            {pick.flowTag ? <Text style={{ color: palette.inkSub, fontSize: 11 }}>{pick.flowTag}</Text> : null}
          </View>
        ) : null}
        <View style={{ gap: 6 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>AI가 주목한 이유</Text>
          <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 21 }}>{pick.reason || '아직 정리된 근거가 없어'}</Text>
        </View>
        {assessment?.reasons.length ? (
          <Text style={{ color: palette.teal, fontSize: 12, lineHeight: 19 }}>{assessment.reasons.join('\n')}</Text>
        ) : null}
        {pick.riskNote ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: palette.orangeSoft, borderRadius: 12, padding: 12 }}>
            <AlertTriangle size={15} color={palette.orange} style={{ marginTop: 2 }} />
            <Text style={{ color: palette.orange, fontSize: 12, lineHeight: 19, flex: 1 }}>{pick.riskNote}</Text>
          </View>
        ) : null}
        {hasPlan && planOpen ? (
          <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 14, padding: 14, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, color: palette.ink, fontSize: 14, fontWeight: '800' }}>검토용 가격 시나리오</Text>
              <Text style={{ color: palette.orange, fontSize: 11 }}>위험 {tradePlanRiskLabel(plan.riskLevel)}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
              <PlanMetric label="기준가" value={formatTradePlanPrice(plan.referencePrice, plan.currency)} palette={palette} />
              <PlanMetric label="진입 상한" value={formatTradePlanPrice(plan.entryLimitPrice, plan.currency)} palette={palette} />
              <PlanMetric label="손절 기준" value={formatTradePlanPrice(plan.stopLossPrice, plan.currency)} palette={palette} accent={palette.red} />
              <PlanMetric label="목표가" value={formatTradePlanPrice(plan.takeProfitPrice, plan.currency)} palette={palette} accent={palette.teal} />
            </View>
            <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '700' }}>종목 비중 최대 {plan.maxPositionPercent}%</Text>
            <View style={{ gap: 5 }}>
              {plan.guardrails.map((item, index) => (
                <Text key={index} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 18 }}>· {item}</Text>
              ))}
            </View>
            <Text style={{ color: !canShare ? palette.orange : palette.inkMuted, fontSize: 12, lineHeight: 19 }}>
              {!canShare ? '만료됐거나 재검증이 필요해 · 새로고침 후 다시 확인해봐' : '30분 유효 · 실제 주문이 아닌 검토 자료야'}
            </Text>
            <Pressable
              disabled={!canShare}
              onPress={() => { void hapticLight(); void sharePlan() }}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canShare }}
              accessibilityLabel="검토 계획 공유"
              style={({ pressed }) => ({
                minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7,
                borderWidth: 1, borderColor: palette.border, borderRadius: 12,
                backgroundColor: palette.surface, opacity: !canShare ? 0.45 : pressed ? 0.65 : 1,
              })}
            >
              <Share2 size={15} color={palette.teal} />
              <Text style={{ color: palette.teal, fontSize: 13, fontWeight: '700' }}>검토 계획 공유</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: palette.borderLight, paddingTop: 8 }}>
          {hasPlan ? (
            <Pressable
              onPress={() => setPlanOpen((value) => !value)}
              accessibilityRole="button"
              accessibilityState={{ expanded: planOpen }}
              style={{ flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Text style={{ color: palette.teal, fontSize: 13, fontWeight: '700' }}>{planOpen ? '계획 접기' : '가격 시나리오'}</Text>
              {planOpen ? <ChevronUp size={15} color={palette.teal} /> : <ChevronDown size={15} color={palette.teal} />}
            </Pressable>
          ) : (
            <Text style={{ flex: 1, color: palette.inkMuted, fontSize: 11, lineHeight: 17 }}>진입 계획 없이 관찰해봐</Text>
          )}
          <Pressable
            disabled={inWatch || adding}
            accessibilityRole="button"
            accessibilityLabel={inWatch ? '관심종목에 추가됨' : '관심종목 추가'}
            accessibilityState={{ disabled: inWatch || adding }}
            onPress={async () => {
              if (adding) return
              setAdding(true); setActionError(null)
              try { await onQuickAdd() } catch { setActionError('관심종목에 추가하지 못했어. 다시 시도해봐.') }
              finally { setAdding(false) }
            }}
            style={({ pressed }) => ({
              minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: palette.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, opacity: pressed ? 0.65 : 1,
            })}
          >
            {inWatch ? <Check size={14} color={palette.teal} /> : <Plus size={14} color={palette.teal} />}
            <Text style={{ color: palette.teal, fontSize: 12, fontWeight: '700' }}>{inWatch ? '관심 등록됨' : adding ? '추가 중' : '관심 추가'}</Text>
          </Pressable>
        </View>
        {actionError ? <Text accessibilityRole="alert" style={{ color: palette.red, fontSize: 12 }}>{actionError}</Text> : null}
      </View>
    </View>
  )
}

function PlanMetric({ label, value, palette, accent }: { label: string; value: string; palette: Palette; accent?: string }) {
  return (
    <View style={{ width: '50%', gap: 5 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: accent ?? palette.ink, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  )
}
