import { Text, View } from 'react-native'
import { Calendar } from 'lucide-react-native'
import type { MarketEvent } from '../../types'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { earningsCoverageNote } from '../../utils/marketDataPresentation'

type Props = {
  events: MarketEvent[]
  earningsStatus?: string
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

export function EventsCard({ events, earningsStatus }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  const statusNote = earningsCoverageNote(earningsStatus)
  if (events.length === 0 && !statusNote) return null

  // 최대 5개만 보여줌
  const display = events.slice(0, 5)
  const next = display[0]

  return (
    <CollapsibleCard
      title={
        <View style={{ gap: 8, minWidth: 0 }}>
          <View style={[styles.cardTitleRow, { flexWrap: 'wrap' }]}>
            <Calendar size={14} color={palette.blue} strokeWidth={2.5} />
            <Text style={styles.cardTitle}>다가오는 이벤트</Text>
            <Text style={styles.metaText}>{events.length > 0 ? `${events.length}건` : earningsStatus !== 'AVAILABLE' ? '자료 확인 필요' : '확인된 일정 없음'}</Text>
          </View>
          {next ? (
            <Text style={styles.metaText} numberOfLines={2}>
              {CATEGORY_ICON[next.category]} {formatDate(next.date)}{next.dateTimezone === 'America/New_York' ? ' ET' : ' KST'} {next.title}
            </Text>
          ) : statusNote ? <Text style={[styles.metaText, { lineHeight: 19 }]}>{statusNote}</Text> : null}
        </View>
      }
    >
      <View style={{ gap: 8 }}>
        {statusNote && display.length > 0 ? <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 18 }}>{statusNote}</Text> : null}
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
              <View style={{ width: 68, alignItems: 'center' }}>
                <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800' }}>
                  {formatDate(event.date)}
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 9 }}>{event.dateTimezone === 'America/New_York' ? '미 동부 날짜' : '한국 날짜'}</Text>
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
    </CollapsibleCard>
  )
}

function formatDate(iso: string): string {
  // "2026-05-19" → "5/19"
  const [, m, d] = iso.split('-')
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`
}
