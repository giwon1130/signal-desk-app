import { Pressable, Text } from 'react-native'
import { TrendingDown, TrendingUp } from 'lucide-react-native'
import type { RecommendationExecutionLog } from '../../../types'
import { type Palette } from '../../../theme'
import { formatSignedRate } from '../../../utils'
import { deltaColor } from '../../shared'

type Props = {
  log: RecommendationExecutionLog
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}

/**
 * 놓친/따라간 픽 위젯 안의 한 줄 — 종목명 + ticker + 실현 수익률.
 */
export function ResultRow({ log, palette, onOpenDetail }: Props) {
  const r = log.realizedReturnRate ?? 0
  const color = deltaColor(r, palette)
  return (
    <Pressable
      onPress={() => onOpenDetail(log.market, log.ticker, log.name)}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 8, paddingVertical: 7, borderRadius: 7,
          backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
        }]
      }}
    >
      {r >= 0
        ? <TrendingUp size={11} color={color} strokeWidth={2.5} />
        : <TrendingDown size={11} color={color} strokeWidth={2.5} />}
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}>
        {log.name}
      </Text>
      <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
        {log.market} · {log.ticker}
      </Text>
      <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 60, textAlign: 'right' }}>
        {formatSignedRate(r)}
      </Text>
    </Pressable>
  )
}
