import { Pressable, Text, View } from 'react-native'
import { TrendingUp } from 'lucide-react-native'
import type { MoverReason, TopMoversResponse } from '../../types'
import { marketColor, type Palette } from '../../theme'
import { formatSignedRate } from '../../utils'
import { Widget, webGrid } from '../shared'
import { MoverContextDetails } from '../../components/MoverContextDetails'
import { findMoverReason } from '../../utils/moverContext'

type Mover = { market: string; ticker: string; name: string; changeRate: number }

/**
 * 오늘의 급등락 — 시장 선호에 따라 섹션 구성이 바뀐다.
 *  KR: KOSPI/KOSDAQ 상승·하락 4열 · US: US 상승·하락 2열 · BOTH: KR(통합)+US 4열
 * 확인된 자료를 종목 아래에 표시하고 출처는 기본 접힘으로 제공한다.
 */
export function TopMoversWidget({
  topMovers, moverReasons = [], marketPreference = 'BOTH', palette, onOpenDetail,
}: {
  topMovers: TopMoversResponse | null
  moverReasons?: MoverReason[]
  marketPreference?: 'KR' | 'US' | 'BOTH'
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}) {
  const reasonOf = (mover: Mover) => findMoverReason(moverReasons, mover.market, mover.ticker, mover.changeRate)

  const krGainers = [...(topMovers?.kospi.gainers ?? []), ...(topMovers?.kosdaq.gainers ?? [])]
    .sort((a, b) => b.changeRate - a.changeRate)
  const krLosers = [...(topMovers?.kospi.losers ?? []), ...(topMovers?.kosdaq.losers ?? [])]
    .sort((a, b) => a.changeRate - b.changeRate)

  const sections: Array<{ label: string; rows: Mover[]; up: boolean }> =
    marketPreference === 'KR' ? [
      { label: 'KOSPI 상승', rows: topMovers?.kospi.gainers?.slice(0, 5) ?? [], up: true },
      { label: 'KOSPI 하락', rows: topMovers?.kospi.losers?.slice(0, 5) ?? [], up: false },
      { label: 'KOSDAQ 상승', rows: topMovers?.kosdaq.gainers?.slice(0, 5) ?? [], up: true },
      { label: 'KOSDAQ 하락', rows: topMovers?.kosdaq.losers?.slice(0, 5) ?? [], up: false },
    ] : marketPreference === 'US' ? [
      { label: '🇺🇸 US 상승', rows: topMovers?.us?.gainers?.slice(0, 8) ?? [], up: true },
      { label: '🇺🇸 US 하락', rows: topMovers?.us?.losers?.slice(0, 8) ?? [], up: false },
    ] : [
      { label: '🇰🇷 KR 상승', rows: krGainers.slice(0, 5), up: true },
      { label: '🇰🇷 KR 하락', rows: krLosers.slice(0, 5), up: false },
      { label: '🇺🇸 US 상승', rows: topMovers?.us?.gainers?.slice(0, 5) ?? [], up: true },
      { label: '🇺🇸 US 하락', rows: topMovers?.us?.losers?.slice(0, 5) ?? [], up: false },
    ]

  const cols = sections.length
  return (
    <Widget
      palette={palette}
      title="오늘의 급등락"
      icon={<TrendingUp size={13} color={palette.teal} strokeWidth={2.5} />}
    >
      <View style={[{ gap: 10 }, webGrid(Array(cols).fill('minmax(0, 1fr)').join(' '))]}>
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
              s.rows.map((r) => {
                const reason = reasonOf(r)
                return (
                  <View key={`${s.label}-${r.ticker}`}>
                  <Pressable
                    onPress={() => onOpenDetail(r.market, r.ticker, r.name)}
                    style={(state) => {
                      const hovered = (state as { hovered?: boolean }).hovered
                      return [{
                        paddingHorizontal: 4, paddingVertical: 4, borderRadius: 5,
                        backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                        gap: 1,
                      }]
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                    </View>
                  </Pressable>
                  <MoverContextDetails reason={reason} />
                  </View>
                )
              })
            )}
          </View>
        ))}
      </View>
    </Widget>
  )
}
