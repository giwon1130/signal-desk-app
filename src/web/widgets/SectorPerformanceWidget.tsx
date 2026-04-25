import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Layers } from 'lucide-react-native'
import type { HoldingPosition, WatchItem } from '../../types'
import { type Palette } from '../../theme'
import { formatSignedRate } from '../../utils'
import { Widget, webGrid } from '../shared'

/**
 * 포트폴리오 + 관심종목을 섹터별로 집계해서 평균 changeRate 를 히트맵 형태로.
 * 별도 백엔드 API 없이 이미 로드된 데이터만 이용. 비어있으면 안내.
 */
export function SectorPerformanceWidget({
  positions, watchlist, palette, onOpenDetail,
}: {
  positions: HoldingPosition[]
  watchlist: WatchItem[]
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  type Bucket = { sector: string; total: number; count: number; members: Array<{ market: string; ticker: string; name: string; changeRate: number }> }
  const buckets = useMemo(() => {
    const map = new Map<string, Bucket>()
    const push = (sector: string, market: string, ticker: string, name: string, changeRate: number) => {
      const key = sector || '기타'
      if (!map.has(key)) map.set(key, { sector: key, total: 0, count: 0, members: [] })
      const b = map.get(key)!
      b.total += changeRate
      b.count += 1
      b.members.push({ market, ticker, name, changeRate })
    }
    for (const p of positions) {
      // HoldingPosition 엔 sector 없어서 watchlist 와 티커 매칭
      const w = watchlist.find((w) => w.market === p.market && w.ticker === p.ticker)
      const sector = w?.sector || ''
      // profitRate 를 change 대리지표로 사용 (현재가 변동률은 없음)
      push(sector, p.market, p.ticker, p.name, (p.profitRate ?? 0) / 100)
    }
    for (const w of watchlist) push(w.sector, w.market, w.ticker, w.name, w.changeRate ?? 0)
    const arr = Array.from(map.values())
    arr.forEach((b) => b.members.sort((a, b) => b.changeRate - a.changeRate))
    arr.sort((a, b) => (b.total / Math.max(1, b.count)) - (a.total / Math.max(1, a.count)))
    return arr
  }, [positions, watchlist])

  const isEmpty = buckets.length === 0

  return (
    <Widget
      palette={palette}
      title="섹터 퍼포먼스"
      icon={<Layers size={13} color={palette.teal} strokeWidth={2.5} />}
      meta={isEmpty ? null : `${buckets.length}개 섹터`}
    >
      {isEmpty ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>관심종목/보유가 있으면 섹터 요약이 떠</Text>
        </View>
      ) : (
        <View style={[{ gap: 8 }, webGrid('repeat(auto-fill, minmax(220px, 1fr))')]}>
          {buckets.slice(0, 8).map((b) => {
            const avg = b.total / Math.max(1, b.count)
            const color = avg > 0 ? palette.up : avg < 0 ? palette.down : palette.inkSub
            const bg = avg > 0 ? palette.upSoft : avg < 0 ? palette.downSoft : palette.surfaceAlt
            return (
              <View
                key={b.sector}
                style={{
                  backgroundColor: bg,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800', flex: 1 }} numberOfLines={1}>
                    {b.sector}
                  </Text>
                  <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                    {formatSignedRate(avg)}
                  </Text>
                </View>
                <Text style={{ color: palette.inkMuted, fontSize: 10 }}>
                  {b.count}종목 · 상위 {b.members.slice(0, 2).map((m) => m.name).join(', ')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                  {b.members.slice(0, 3).map((m) => (
                    <Pressable
                      key={`${b.sector}-${m.ticker}`}
                      onPress={() => onOpenDetail(m.market, m.ticker, m.name)}
                      style={{
                        backgroundColor: palette.surface,
                        borderRadius: 4,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderWidth: 1,
                        borderColor: palette.border,
                      }}
                    >
                      <Text style={{ color: palette.inkSub, fontSize: 9, fontWeight: '700' }}>{m.ticker}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )
          })}
        </View>
      )}
    </Widget>
  )
}
