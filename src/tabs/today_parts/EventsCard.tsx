import { Text, View } from 'react-native'
import { Calendar } from 'lucide-react-native'
import type { MarketEvent } from '../../types'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'

type Props = {
  events: MarketEvent[]
}

const CATEGORY_ICON: Record<MarketEvent['category'], string> = {
  FOMC: '🏦',
  EARNINGS: '📊',
  POLICY: '⚖️',
  ECONOMIC_DATA: '📈',
  HOLIDAY: '🌙',
  OTHER: '🗓️',
}

const MARKET_FLAG: Record<MarketEvent['market'], string> = {
  KR: '🇰🇷',
  US: '🇺🇸',
  GLOBAL: '🌐',
}

export function EventsCard({ events }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  if (events.length === 0) return null

  // 최대 5개만 보여줌
  const display = events.slice(0, 5)

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Calendar size={14} color={palette.blue} strokeWidth={2.5} />
        <Text style={styles.cardTitle}>다가오는 이벤트</Text>
        <Text style={[styles.metaText, { marginLeft: 'auto' }]}>{events.length}건</Text>
      </View>
      <View style={{ gap: 8, marginTop: 8 }}>
        {display.map((event) => {
          const importanceColor =
            event.importance === 'HIGH' ? palette.down :
            event.importance === 'MEDIUM' ? palette.orange : palette.inkMuted
          return (
            <View
              key={event.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
                borderTopWidth: 1,
                borderTopColor: palette.border,
              }}
            >
              <View style={{ width: 48, alignItems: 'center' }}>
                <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800' }}>
                  {formatDate(event.date)}
                </Text>
                {event.time ? (
                  <Text style={{ color: palette.inkMuted, fontSize: 9, fontWeight: '700' }}>
                    {event.time}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 16 }}>{CATEGORY_ICON[event.category]}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ color: palette.ink, fontSize: 13, fontWeight: '700' }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {event.title}
                </Text>
                {event.description ? (
                  <Text
                    style={{ color: palette.inkMuted, fontSize: 11 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {event.description}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 11, marginRight: 2 }}>{MARKET_FLAG[event.market]}</Text>
              {event.importance !== 'LOW' ? (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: importanceColor,
                  }}
                />
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

function formatDate(iso: string): string {
  // "2026-05-19" → "5/19"
  const [, m, d] = iso.split('-')
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`
}
