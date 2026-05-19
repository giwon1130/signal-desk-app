import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Bell, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { Palette } from '../../theme'
import type { RecommendationExecutionLog, WatchItem } from '../../types'
import { formatSignedRate } from '../../utils'
import { hapticLight } from '../../utils/haptics'
import { Card } from './Card'

type Props = {
  logs: RecommendationExecutionLog[]
  watchlist: WatchItem[]
  palette: Palette
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function HiddenSignals({ logs, watchlist, palette, onOpenDetail }: Props) {
  // 보유·관심 종목 중 AI가 최근 주목한 항목
  const signals = useMemo(() => {
    const watchSet = new Set(watchlist.map((w) => `${w.market}:${w.ticker}`))
    return logs
      .filter((l) => l.userStatus === 'HELD' || l.userStatus === 'WATCHED' || watchSet.has(`${l.market}:${l.ticker}`))
      .slice(0, 6)
  }, [logs, watchlist])

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
          <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
            관심·보유 종목에 AI 신호가 생기면 여기 떠
          </Text>
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          {signals.map((l, i) => (
            <SignalRow
              key={`${l.date}-${l.market}-${l.ticker}-${i}`}
              log={l}
              palette={palette}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </View>
      )}
    </Card>
  )
}

function SignalRow({
  log, palette, onOpenDetail,
}: {
  log: RecommendationExecutionLog
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const exp = log.expectedReturnRate
  const isUp = exp == null || exp >= 0
  const statusColor = log.userStatus === 'HELD' ? palette.up : palette.blue
  const statusLabel = log.userStatus === 'HELD' ? '보유' : '관심'

  return (
    <Pressable
      onPress={() => { void hapticLight(); onOpenDetail(log.market, log.ticker, log.name) }}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 6, paddingVertical: 8, borderRadius: 8,
        backgroundColor: pressed ? palette.surfaceAlt : palette.bg,
        borderWidth: 1, borderColor: palette.border,
      })}
    >
      {isUp
        ? <TrendingUp size={13} color={palette.up} strokeWidth={2.5} />
        : <TrendingDown size={13} color={palette.down} strokeWidth={2.5} />}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 13, fontWeight: '800', flex: 1 }}>
            {log.name}
          </Text>
          <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ color: statusColor, fontSize: 9, fontWeight: '800' }}>{statusLabel}</Text>
          </View>
        </View>
        {log.rationale ? (
          <Text numberOfLines={2} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15 }}>
            {log.rationale}
          </Text>
        ) : null}
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
          {log.market} · {log.ticker}
        </Text>
      </View>
      {exp != null ? (
        <Text style={{
          color: exp >= 0 ? palette.up : palette.down,
          fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'],
        }}>
          {formatSignedRate(exp)}
        </Text>
      ) : null}
    </Pressable>
  )
}
