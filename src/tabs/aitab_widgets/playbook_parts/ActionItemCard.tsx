import { Pressable, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'
import type { BriefingAction } from '../../../types'
import type { Palette } from '../../../theme'
import { hapticLight } from '../../../utils/haptics'

type Props = {
  action: BriefingAction
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
  inWatch: boolean
}

/**
 * 오늘 액션 카드 (모바일) — priority 별 색상, 종목 매핑 시 모달 진입 + haptic 피드백.
 * 웹용 `web/widgets/aiplaybook_parts/ActionItemCard` 와 비슷하지만 hover 가 아닌 pressed + 햅틱.
 */
export function ActionItemCard({ action, palette, onOpenDetail, inWatch }: Props) {
  const pri = action.priority
  const priColor = pri === 'high' ? palette.down : pri === 'medium' ? palette.orange : palette.teal
  const priSoft = pri === 'high' ? palette.downSoft : pri === 'medium' ? palette.orangeSoft : palette.tealSoft
  const priLabel = pri === 'high' ? '긴급' : pri === 'medium' ? '중요' : '참고'
  const clickable = !!(action.market && action.ticker)
  const onPress = clickable
    ? () => { void hapticLight(); onOpenDetail(action.market!, action.ticker!, action.title) }
    : undefined

  return (
    <Pressable
      onPress={onPress}
      disabled={!clickable}
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
        <View style={{ backgroundColor: priSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: priColor, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{priLabel}</Text>
        </View>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
          {action.category}
        </Text>
        <View style={{ flex: 1 }} />
        {inWatch ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Check size={10} color={palette.up} strokeWidth={3} />
            <Text style={{ color: palette.up, fontSize: 9, fontWeight: '800' }}>관심</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800', lineHeight: 18 }} numberOfLines={2}>
        {action.title}
      </Text>
      {action.detail ? (
        <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 16 }} numberOfLines={3}>
          {action.detail}
        </Text>
      ) : null}
      {action.ticker ? (
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }}>
          {action.market} · {action.ticker}
        </Text>
      ) : null}
    </Pressable>
  )
}
