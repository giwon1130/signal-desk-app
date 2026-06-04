import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { AlertTriangle, Check, Plus } from 'lucide-react-native'
import type { AiPick } from '../../../types'
import type { Palette } from '../../../theme'
import { formatSignedRate } from '../../../utils'
import { hapticLight } from '../../../utils/haptics'

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
  const exp = pick.expectedReturnRate
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
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
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

function simpleDelta(value: number | null | undefined, palette: Palette) {
  if (value == null || Number.isNaN(value)) return palette.inkSub
  if (value > 0) return palette.up
  if (value < 0) return palette.down
  return palette.inkSub
}
