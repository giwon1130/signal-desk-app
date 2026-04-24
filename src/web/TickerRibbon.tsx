import { Platform, Pressable, Text, View } from 'react-native'
import type { MarketSectionsData, IndexMetric } from '../types'
import { marketColor, useTheme } from '../theme'
import { formatCompactNumber, formatSignedRate } from '../utils'

/**
 * 최상단 고정 티커 리본.
 *
 * - Yahoo Finance / Investing.com 처럼 어느 탭을 보든 항상 주요 지수가 보이게.
 * - 데이터 소스: /api/v1/market/summary 가 아니라 /api/v1/market/sections (koreaMarket/usMarket.indices).
 *   이쪽이 KOSPI/KOSDAQ/S&P500/NASDAQ 를 다 담고 있음.
 * - 지수는 실시간 WS 가 아니라 30s~ 폴링 스냅샷. Phase 1 은 이걸로 충분.
 *   (개별 종목 실시간은 `useLivePrices` 로 `ContextSidebar` 에서 따로 처리)
 * - 클릭 시 시장 탭으로 이동.
 */

type Props = {
  sections: MarketSectionsData | null
  onClickIndex?: (market: 'KR' | 'US') => void
}

export function TickerRibbon({ sections, onClickIndex }: Props) {
  const { palette } = useTheme()

  // 지수 순서를 사람이 보는 순서로: KOSPI → KOSDAQ → S&P500 → NASDAQ → DOW
  const indices: Array<{ market: 'KR' | 'US'; item: IndexMetric }> = []
  if (sections?.koreaMarket?.indices) {
    for (const it of sections.koreaMarket.indices) indices.push({ market: 'KR', item: it })
  }
  if (sections?.usMarket?.indices) {
    for (const it of sections.usMarket.indices) indices.push({ market: 'US', item: it })
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 4,
        backgroundColor: palette.scheme === 'dark' ? '#0b1220' : '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: palette.scheme === 'dark' ? '#1e293b' : '#0b1220',
        // 가로 스크롤이 필요한 상황에 대비 (좁은 폭)
        ...(Platform.OS === 'web' ? ({ overflowX: 'auto', overflowY: 'hidden' } as object) : null),
      }}
    >
      <Text
        style={{
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 2,
          paddingRight: 10,
          borderRightWidth: 1,
          borderRightColor: '#1e293b',
          marginRight: 10,
        }}
      >
        LIVE
      </Text>
      {indices.length === 0 ? (
        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>
          지수 데이터를 불러오는 중…
        </Text>
      ) : (
        indices.map(({ market, item }) => {
          const color = marketColor(palette, market, item.changeRate)
          return (
            <Pressable
              key={`${market}-${item.label}`}
              onPress={() => onClickIndex?.(market)}
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered
                return [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: hovered ? '#1e293b' : 'transparent',
                  },
                ]
              }}
            >
              <Text style={{ color: '#e2e8f0', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 }}>
                {item.label}
              </Text>
              <Text style={{ color: '#e2e8f0', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {formatCompactNumber(item.value)}
              </Text>
              <Text style={{ color, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {formatSignedRate(item.changeRate)}
              </Text>
            </Pressable>
          )
        })
      )}
    </View>
  )
}
