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
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function TopMoversSection({ topMovers, kind, onOpenDetail }: Props) {
  const styles = useStyles()
  const isUp = kind === 'gainers'
  const color = isUp ? '#dc2626' : '#2563eb'
  const Icon = isUp ? Flame : Snowflake
  const title = isUp ? '급등 종목 (KOSPI · KOSDAQ)' : '급락 종목 (KOSPI · KOSDAQ)'
  const kospi = isUp ? topMovers.kospi.gainers : topMovers.kospi.losers
  const kosdaq = isUp ? topMovers.kosdaq.gainers : topMovers.kosdaq.losers
  const head = kospi[0]
  const prefix = isUp ? 'up' : 'dn'
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
      <Text style={styles.metaText}>KOSPI · {kospi.length}종목</Text>
      {kospi.map((m) => (
        <MoverRow key={`kospi-${prefix}-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
      ))}
      <Text style={[styles.metaText, { marginTop: 6 }]}>KOSDAQ · {kosdaq.length}종목</Text>
      {kosdaq.map((m) => (
        <MoverRow key={`kosdaq-${prefix}-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
      ))}
    </CollapsibleCard>
  )
}
