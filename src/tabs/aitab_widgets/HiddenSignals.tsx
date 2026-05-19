import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Bell, Newspaper, TrendingDown, TrendingUp } from 'lucide-react-native'
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

/**
 * 사용자의 보유·관심 종목에 대한 AI 시그널.
 *
 * 우선순위:
 *   1) 보유 종목 (HELD)
 *   2) 관심 종목 (WATCHED + watchSet)
 *   3) confidence 높은 순
 *   4) RecommendationExecutionLog의 신선도(date)
 *
 * 데이터가 풍부한 시그널 우선: realizedReturnRate(검증) > confidence(예측) > newsTitle(근거).
 */
export function HiddenSignals({ logs, watchlist, palette, onOpenDetail }: Props) {
  const signals = useMemo(() => {
    const watchSet = new Set(watchlist.map((w) => `${w.market}:${w.ticker}`))
    const matched = logs.filter((l) =>
      l.userStatus === 'HELD'
      || l.userStatus === 'WATCHED'
      || watchSet.has(`${l.market}:${l.ticker}`),
    )
    // 정렬: 보유 → 관심 → confidence ↓ → date ↓
    return matched.sort((a, b) => {
      const heldScore = (u?: string) => u === 'HELD' ? 0 : u === 'WATCHED' ? 1 : 2
      const sa = heldScore(a.userStatus)
      const sb = heldScore(b.userStatus)
      if (sa !== sb) return sa - sb
      const ca = a.confidence ?? 0
      const cb = b.confidence ?? 0
      if (ca !== cb) return cb - ca
      return (b.date ?? '').localeCompare(a.date ?? '')
    }).slice(0, 6)
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
          <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center', paddingHorizontal: 20 }}>
            보유·관심 종목에 AI 추천이 잡히면 여기 떠.{'\n'}종목 상세에서 관심 등록부터 시작해봐.
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
  const realized = log.realizedReturnRate
  // 표시할 수익률: realized 있으면 그것 (검증 완료), 없으면 expected (예측)
  const showRate = realized ?? exp
  const showRateLabel = realized != null ? '실현' : 'AI 기대'
  const isUp = showRate == null || showRate >= 0

  const statusColor =
    log.userStatus === 'HELD' ? palette.up :
    log.userStatus === 'WATCHED' ? palette.blue : palette.inkMuted
  const statusLabel =
    log.userStatus === 'HELD' ? '보유' :
    log.userStatus === 'WATCHED' ? '관심' : 'AI 추천'

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
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ color: palette.ink, fontSize: 13, fontWeight: '800', flex: 1 }}
          >
            {log.name}
          </Text>
          <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ color: statusColor, fontSize: 9, fontWeight: '800' }}>{statusLabel}</Text>
          </View>
          {log.confidence != null ? (
            <View style={{ backgroundColor: palette.purple + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ color: palette.purple, fontSize: 9, fontWeight: '800' }}>
                {Math.round(log.confidence * 100)}%
              </Text>
            </View>
          ) : null}
        </View>
        {log.rationale ? (
          <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 15 }}>
            {log.rationale}
          </Text>
        ) : null}
        {log.newsTitle ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Newspaper size={9} color={palette.inkFaint} strokeWidth={2.5} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: palette.inkFaint, fontSize: 10, fontStyle: 'italic', flex: 1 }}
            >
              {log.newsTitle}
            </Text>
          </View>
        ) : null}
        <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
          {log.market} · {log.ticker}
        </Text>
      </View>
      {showRate != null ? (
        <View style={{ alignItems: 'flex-end', gap: 1 }}>
          <Text style={{
            color: showRate >= 0 ? palette.up : palette.down,
            fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'],
          }}>
            {formatSignedRate(showRate)}
          </Text>
          <Text style={{ color: palette.inkFaint, fontSize: 8, fontWeight: '700', letterSpacing: 0.3 }}>
            {showRateLabel}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}
