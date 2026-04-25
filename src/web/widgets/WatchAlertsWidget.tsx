import { Pressable, Text, View } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import type { MarketSummaryData } from '../../types'
import { type Palette } from '../../theme'
import { Widget } from '../shared'

export function WatchAlertsWidget({
  summary, palette, onOpenDetail,
}: {
  summary: MarketSummaryData | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const alerts = summary?.watchAlerts?.slice(0, 8) ?? []
  return (
    <Widget
      palette={palette}
      title="경보"
      icon={<AlertTriangle size={13} color={palette.orange} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {alerts.length}건
        </Text>
      }
    >
      {alerts.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>주의 신호 없음</Text>
        </View>
      ) : (
        alerts.map((a) => (
          <Pressable
            key={`${a.market}-${a.ticker}-${a.category}-${a.title}`}
            onPress={() => onOpenDetail(a.market, a.ticker, a.name)}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered
              return [{
                paddingHorizontal: 8, paddingVertical: 7, borderRadius: 7,
                backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                gap: 2,
              }]
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
                  backgroundColor:
                    a.severity === 'high' ? palette.redSoft
                    : a.severity === 'medium' ? palette.orangeSoft
                    : palette.surfaceAlt,
                }}
              >
                <Text
                  style={{
                    color:
                      a.severity === 'high' ? palette.red
                      : a.severity === 'medium' ? palette.orange
                      : palette.inkMuted,
                    fontSize: 9,
                    fontWeight: '800',
                    letterSpacing: 0.5,
                  }}
                >
                  {a.severity.toUpperCase()}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}
              >
                {a.name}
              </Text>
              <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }}>
                {a.category}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}
            >
              {a.title}
            </Text>
          </Pressable>
        ))
      )}
    </Widget>
  )
}
