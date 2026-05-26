import { Text, View } from 'react-native'
import { Flame, Snowflake } from 'lucide-react-native'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { useStyles } from '../../styles'
import type { TopMoversResponse } from '../../types'
import { formatSignedRate } from '../../utils'
import { MoverRow } from './MoverRow'

type Props = {
  topMovers: TopMoversResponse
  kind: 'gainers' | 'losers'
  market?: 'KR' | 'US'   // 디폴트 'KR' — 기존 호출과 호환
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function TopMoversSection({ topMovers, kind, market = 'KR', onOpenDetail }: Props) {
  const styles = useStyles()
  const isUp = kind === 'gainers'
  const isKr = market === 'KR'
  const color = isUp ? '#dc2626' : '#2563eb'
  const Icon = isUp ? Flame : Snowflake
  const flag = isKr ? '🇰🇷' : '🇺🇸'
  const verb = isUp ? '급등' : '급락'
  const scope = isKr ? 'KOSPI · KOSDAQ' : 'NASDAQ · NYSE'
  const title = `${flag} ${verb} 종목 (${scope})`
  const prefix = `${market.toLowerCase()}-${isUp ? 'up' : 'dn'}`

  // KR: kospi + kosdaq 두 묶음. US: 통합 한 묶음.
  const krGroups = isKr
    ? [
        { label: 'KOSPI', items: isUp ? topMovers.kospi.gainers : topMovers.kospi.losers },
        { label: 'KOSDAQ', items: isUp ? topMovers.kosdaq.gainers : topMovers.kosdaq.losers },
      ]
    : []
  const usItems = !isKr
    ? (isUp ? (topMovers.us?.gainers ?? []) : (topMovers.us?.losers ?? []))
    : []
  const head = isKr ? krGroups[0].items[0] : usItems[0]

  return (
    <CollapsibleCard
      title={
        <View style={styles.cardTitleRow}>
          <Icon size={14} color={color} strokeWidth={2.5} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      }
      preview={
        <Text style={[styles.metaText, { color, fontWeight: '700' }]}>
          {head ? `${head.name} ${formatSignedRate(head.changeRate)}` : '-'}
        </Text>
      }
    >
      {isKr ? (
        krGroups.map((g, gi) => (
          <View key={g.label}>
            <Text style={[styles.metaText, gi > 0 && { marginTop: 6 }]}>
              {g.label} · {g.items.length}종목
            </Text>
            {g.items.map((m) => (
              <MoverRow key={`${prefix}-${g.label}-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
            ))}
          </View>
        ))
      ) : (
        <>
          <Text style={styles.metaText}>US · {usItems.length}종목</Text>
          {usItems.map((m) => (
            <MoverRow key={`${prefix}-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
          ))}
        </>
      )}
    </CollapsibleCard>
  )
}
