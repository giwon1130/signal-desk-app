import { Pressable, Text, View } from 'react-native'
import { TrendingUp } from 'lucide-react-native'
import type { TopMoversResponse } from '../../types'
import { marketColor, type Palette } from '../../theme'
import { formatSignedRate } from '../../utils'
import { Widget, webGrid } from '../shared'

export function TopMoversWidget({
  topMovers, palette, onOpenDetail,
}: {
  topMovers: TopMoversResponse | null
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const sections = [
    { label: 'KOSPI 상승', rows: topMovers?.kospi.gainers?.slice(0, 5) ?? [],  up: true  },
    { label: 'KOSPI 하락', rows: topMovers?.kospi.losers?.slice(0, 5)  ?? [],  up: false },
    { label: 'KOSDAQ 상승', rows: topMovers?.kosdaq.gainers?.slice(0, 5) ?? [], up: true  },
    { label: 'KOSDAQ 하락', rows: topMovers?.kosdaq.losers?.slice(0, 5)  ?? [], up: false },
  ]
  return (
    <Widget
      palette={palette}
      title="오늘의 급등락"
      icon={<TrendingUp size={13} color={palette.teal} strokeWidth={2.5} />}
    >
      <View style={[{ gap: 10 }, webGrid('minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)')]}>
        {sections.map((s) => (
          <View key={s.label} style={{ gap: 3 }}>
            <Text style={{
              color: s.up ? palette.up : palette.down,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 0.5,
              paddingBottom: 3,
              borderBottomWidth: 1,
              borderBottomColor: palette.border,
            }}>
              {s.label}
            </Text>
            {s.rows.length === 0 ? (
              <Text style={{ color: palette.inkFaint, fontSize: 10, paddingVertical: 8 }}>—</Text>
            ) : (
              s.rows.map((r) => (
                <Pressable
                  key={`${s.label}-${r.ticker}`}
                  onPress={() => onOpenDetail(r.market, r.ticker, r.name)}
                  style={(state) => {
                    const hovered = (state as { hovered?: boolean }).hovered
                    return [{
                      paddingHorizontal: 4, paddingVertical: 4, borderRadius: 5,
                      backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }]
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ color: palette.ink, fontSize: 11, fontWeight: '700', flex: 1 }}
                  >
                    {r.name}
                  </Text>
                  <Text style={{
                    color: marketColor(palette, r.market, r.changeRate),
                    fontSize: 11,
                    fontWeight: '800',
                    fontVariant: ['tabular-nums'],
                  }}>
                    {formatSignedRate(r.changeRate)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        ))}
      </View>
    </Widget>
  )
}
