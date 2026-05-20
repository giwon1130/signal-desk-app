import { Pressable, Text, View } from 'react-native'
import { Bell, Building2, FileText, TrendingDown, TrendingUp, Users } from 'lucide-react-native'
import type { Palette } from '../../theme'
import type { HiddenSignal, SignalTrigger } from '../../types'
import { hapticLight } from '../../utils/haptics'
import { Card } from './Card'

type Props = {
  signals: HiddenSignal[]
  palette: Palette
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

/**
 * 숨은 시그널 — 보유/관심 종목에 잡힌 공시·수급·급등락 실데이터.
 * 백엔드(HiddenSignalService)가 트리거 많은 순으로 정렬해 내려준다.
 */
export function HiddenSignals({ signals, palette, onOpenDetail }: Props) {
  return (
    <Card
      palette={palette}
      title="숨은 시그널"
      icon={<Bell size={13} color={palette.orange} strokeWidth={2.5} />}
      meta={signals.length > 0 ? `${signals.length}건` : undefined}
    >
      {signals.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
          <Bell size={20} color={palette.inkFaint} strokeWidth={2} />
          <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>
            주목할 시그널 없음
          </Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', paddingHorizontal: 20 }}>
            보유·관심 종목에 공시·수급·급등락이 잡히면 여기 떠.{'\n'}종목 상세에서 관심 등록부터 시작해봐.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {signals.slice(0, 8).map((s) => (
            <SignalRow key={`${s.market}-${s.ticker}`} signal={s} palette={palette} onOpenDetail={onOpenDetail} />
          ))}
        </View>
      )}
    </Card>
  )
}

function SignalRow({
  signal, palette, onOpenDetail,
}: {
  signal: HiddenSignal
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  // 공시 제목 등 부가 설명은 트리거 중 detail 이 있는 첫 항목에서.
  const detail = signal.triggers.find((t) => t.detail)?.detail

  return (
    <Pressable
      onPress={() => { void hapticLight(); onOpenDetail(signal.market, signal.ticker, signal.name) }}
      style={({ pressed }) => ({
        gap: 6,
        paddingHorizontal: 8, paddingVertical: 9, borderRadius: 8,
        backgroundColor: pressed ? palette.surfaceAlt : palette.bg,
        borderWidth: 1, borderColor: palette.border,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color: palette.ink, fontSize: 13, fontWeight: '800', flex: 1 }}
        >
          {signal.name}
        </Text>
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }}>
          {signal.market} · {signal.ticker}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {signal.triggers.map((t, i) => (
          <TriggerChip key={i} trigger={t} palette={palette} />
        ))}
      </View>
      {detail ? (
        <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: palette.inkMuted, fontSize: 10, fontStyle: 'italic' }}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  )
}

function TriggerChip({ trigger, palette }: { trigger: SignalTrigger; palette: Palette }) {
  const { color, bg, Icon } = triggerStyle(trigger.type, palette)
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: bg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    }}>
      <Icon size={9} color={color} strokeWidth={2.5} />
      <Text style={{ color, fontSize: 9, fontWeight: '800' }}>{trigger.label}</Text>
    </View>
  )
}

function triggerStyle(type: string, palette: Palette) {
  switch (type) {
    case 'DISCLOSURE':
      return { color: palette.blue, bg: palette.blueSoft, Icon: FileText }
    case 'FOREIGN_BUY':
      return { color: palette.teal, bg: palette.tealSoft, Icon: Users }
    case 'INSTITUTION_BUY':
      return { color: palette.purple, bg: palette.purple + '22', Icon: Building2 }
    case 'SURGE':
      return { color: palette.up, bg: palette.upSoft, Icon: TrendingUp }
    case 'PLUNGE':
      return { color: palette.down, bg: palette.downSoft, Icon: TrendingDown }
    default:
      return { color: palette.inkMuted, bg: palette.surfaceAlt, Icon: Bell }
  }
}
