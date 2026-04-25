import { Pressable, Text, View } from 'react-native'
import { Target, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { AlertHistoryItem } from '../../types'
import { type Palette } from '../../theme'
import { formatSignedRate } from '../../utils'
import { Widget } from '../shared'

export function AlertTimelineWidget({
  history, palette, onOpenDetail,
}: {
  history: AlertHistoryItem[]
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const items = history.slice(0, 10)
  return (
    <Widget
      palette={palette}
      title="최근 알림"
      icon={<Target size={13} color={palette.red} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {items.length}건
        </Text>
      }
    >
      {items.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>알림 내역 없음</Text>
        </View>
      ) : (
        items.map((a, i) => {
          const color = a.direction === 'UP' ? palette.up : palette.down
          return (
            <Pressable
              key={`${a.market}-${a.ticker}-${a.sentAt}-${i}`}
              onPress={() => onOpenDetail(a.market, a.ticker, a.name)}
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered
                return [{
                  paddingHorizontal: 6, paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                }]
              }}
            >
              {a.direction === 'UP'
                ? <TrendingUp size={11} color={color} strokeWidth={2.5} />
                : <TrendingDown size={11} color={color} strokeWidth={2.5} />}
              <Text
                numberOfLines={1}
                style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}
              >
                {a.name}
              </Text>
              <Text style={{ color, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {formatSignedRate(a.changeRate)}
              </Text>
              <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
                {a.alertDate}
              </Text>
            </Pressable>
          )
        })
      )}
    </Widget>
  )
}
