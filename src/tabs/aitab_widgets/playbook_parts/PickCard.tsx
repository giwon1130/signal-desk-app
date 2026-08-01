import { useState } from 'react'
import { Pressable, Share, Text, View } from 'react-native'
import { AlertTriangle, Check, ChevronDown, ChevronUp, Plus, Share2, ShieldCheck } from 'lucide-react-native'
import type { AiPick } from '../../../types'
import type { Palette } from '../../../theme'
import { formatSignedRate } from '../../../utils'
import { hapticLight } from '../../../utils/haptics'
import {
  buildTradePlanShareText,
  formatTradePlanPrice,
  isTradePlanExpired,
  tradePlanRiskLabel,
} from '../../../utils/tradePlan'

type Props = {
  pick: AiPick
  palette: Palette
  inWatch: boolean
  onOpenDetail: (m: string, t: string, n?: string) => void
  onQuickAdd: () => Promise<void>
}

/**
 * AI 픽 카드 (모바일) — 확신 % + 기대 수익률 + reason + riskNote + 관심 추가 액션.
 * 웹용 `web/widgets/aiplaybook_parts/PickCard` 는 RecommendationExecutionLog 기반이지만
 * 모바일은 AiPick 기반 (다른 데이터 소스/스키마).
 */
export function PickCard({ pick, palette, inWatch, onOpenDetail, onQuickAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const exp = pick.expectedReturnRate
  const plan = pick.tradePlan
  const expired = plan ? isTradePlanExpired(plan) : false

  const sharePlan = async () => {
    const message = buildTradePlanShareText(pick)
    if (!message) return
    await Share.share({ message, title: `${pick.name} 매매 계획` })
  }
  return (
    <Pressable
      onPress={() => { void hapticLight(); onOpenDetail(pick.market, pick.ticker, pick.name) }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.surfaceAlt : palette.bg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 12,
        gap: 6,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{pick.market}</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '700' }}>{pick.ticker}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '700' }}>AI 추정</Text>
        <Text style={{ color: palette.purple, fontSize: 10, fontWeight: '800' }}>
          확신 {pick.confidence}%
        </Text>
        {exp != null ? (
          <Text style={{ color: simpleDelta(exp, palette), fontSize: 10, fontWeight: '800' }}>
            기대 {formatSignedRate(exp)}
          </Text>
        ) : null}
      </View>
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>
        {pick.name}
      </Text>
      {/* 근거 데이터 — 당일 등락률 + 수급 태그 (왜 골랐는지 투명하게) */}
      {(pick.changeRate != null || pick.flowTag) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {pick.changeRate != null ? (
            <View style={{ backgroundColor: simpleDelta(pick.changeRate, palette) + '1f', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: simpleDelta(pick.changeRate, palette), fontSize: 9, fontWeight: '800' }}>
                당일 {formatSignedRate(pick.changeRate)}
              </Text>
            </View>
          ) : null}
          {pick.flowTag ? (
            <View style={{ backgroundColor: palette.blueSoft, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: palette.blue, fontSize: 9, fontWeight: '800' }}>{pick.flowTag}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text numberOfLines={3} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15 }}>
        {pick.reason || '—'}
      </Text>
      {pick.riskNote ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: palette.downSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4,
        }}>
          <AlertTriangle size={10} color={palette.down} strokeWidth={2.5} />
          <Text style={{ color: palette.down, fontSize: 10, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {pick.riskNote}
          </Text>
        </View>
      ) : null}
      {plan && planOpen ? (
        <View style={{
          backgroundColor: palette.surfaceAlt, borderRadius: 9,
          borderWidth: 1, borderColor: palette.borderLight,
          padding: 10, gap: 9,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={13} color={expired ? palette.down : palette.blue} strokeWidth={2.5} />
            <Text style={{ color: palette.ink, fontSize: 11, fontWeight: '900', flex: 1 }}>
              검토용 매매 계획
            </Text>
            <View style={{
              backgroundColor: plan.riskLevel === 'HIGH' ? palette.downSoft : plan.riskLevel === 'LOW' ? palette.upSoft : palette.blueSoft,
              borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
            }}>
              <Text style={{
                color: plan.riskLevel === 'HIGH' ? palette.down : plan.riskLevel === 'LOW' ? palette.up : palette.blue,
                fontSize: 9, fontWeight: '900',
              }}>
                위험 {tradePlanRiskLabel(plan.riskLevel)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
            <PlanMetric label="기준가" value={formatTradePlanPrice(plan.referencePrice, plan.currency)} palette={palette} />
            <PlanMetric label="진입 상한" value={formatTradePlanPrice(plan.entryLimitPrice, plan.currency)} palette={palette} accent={palette.blue} />
            <PlanMetric label="손절 기준" value={formatTradePlanPrice(plan.stopLossPrice, plan.currency)} palette={palette} accent={palette.down} />
            <PlanMetric label="목표가" value={formatTradePlanPrice(plan.takeProfitPrice, plan.currency)} palette={palette} accent={palette.up} />
          </View>

          <View style={{ gap: 3 }}>
            <Text style={{ color: palette.inkSub, fontSize: 10, fontWeight: '800' }}>
              종목 비중 최대 {plan.maxPositionPercent}%
            </Text>
            {plan.guardrails.slice(0, 3).map((item) => (
              <Text key={item} style={{ color: palette.inkMuted, fontSize: 9.5, lineHeight: 14 }}>· {item}</Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: expired ? palette.down : palette.inkFaint, fontSize: 9.5, flex: 1, fontWeight: expired ? '800' : '600' }}>
              {expired ? '계획 만료됨 · 새로고침 후 다시 확인' : '30분 유효 · 실제 주문 아님'}
            </Text>
            <Pressable
              onPress={(e: any) => { e?.stopPropagation?.(); void hapticLight(); void sharePlan() }}
              accessibilityRole="button"
              accessibilityLabel="매매 계획 공유"
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: palette.blueSoft, borderRadius: 6,
                paddingHorizontal: 8, paddingVertical: 5, opacity: pressed ? 0.65 : 1,
              })}
            >
              <Share2 size={10} color={palette.blue} strokeWidth={2.6} />
              <Text style={{ color: palette.blue, fontSize: 9.5, fontWeight: '900' }}>공유</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {plan ? (
          <Pressable
            onPress={(e: any) => {
              e?.stopPropagation?.()
              void hapticLight()
              setPlanOpen((value) => !value)
            }}
            accessibilityRole="button"
            accessibilityLabel={planOpen ? '매매 계획 접기' : '매매 계획 보기'}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4 }}
          >
            {planOpen
              ? <ChevronUp size={11} color={palette.blue} strokeWidth={2.8} />
              : <ChevronDown size={11} color={palette.blue} strokeWidth={2.8} />}
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '900' }}>
              {planOpen ? '계획 접기' : '매매 계획'}
            </Text>
          </Pressable>
        ) : <View />}
        {inWatch ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Check size={10} color={palette.up} strokeWidth={3} />
            <Text style={{ color: palette.up, fontSize: 10, fontWeight: '800' }}>관심</Text>
          </View>
        ) : (
          <Pressable
            onPress={async (e: any) => {
              e?.stopPropagation?.()
              if (adding) return
              void hapticLight()
              setAdding(true)
              try { await onQuickAdd() } finally { setAdding(false) }
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              backgroundColor: palette.blueSoft, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4,
            }}
          >
            <Plus size={10} color={palette.blue} strokeWidth={3} />
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '800' }}>
              {adding ? '추가 중…' : '관심'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  )
}

function PlanMetric({
  label, value, palette, accent,
}: { label: string; value: string; palette: Palette; accent?: string }) {
  return (
    <View style={{ width: '50%', gap: 2 }}>
      <Text style={{ color: palette.inkFaint, fontSize: 8.5, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: accent ?? palette.ink, fontSize: 11, fontWeight: '900' }}>{value}</Text>
    </View>
  )
}

function simpleDelta(value: number | null | undefined, palette: Palette) {
  if (value == null || Number.isNaN(value)) return palette.inkSub
  if (value > 0) return palette.up
  if (value < 0) return palette.down
  return palette.inkSub
}
