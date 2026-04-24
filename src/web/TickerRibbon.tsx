import { Platform, Pressable, Text, View } from 'react-native'
import type { MarketSectionsData, IndexMetric, MarketSessionStatus } from '../types'
import { marketColor, useTheme } from '../theme'
import { formatCompactNumber, formatSignedRate } from '../utils'
import { Sparkline } from './shared'

/**
 * 최상단 고정 티커 리본.
 *
 * Phase 5 추가:
 * - 세션 배지 (KR/US OPEN · CLOSED · PRE · POST) — marketSessions 이용
 * - 각 지수 칩에 스파크라인 (periods[0].points 의 close 시퀀스)
 *
 * - Yahoo Finance / Investing.com 처럼 어느 탭을 보든 항상 주요 지수가 보이게.
 * - 지수 데이터: /api/v1/market/sections (koreaMarket/usMarket.indices)
 * - 클릭 시 시장 탭으로 이동.
 */

type Props = {
  sections: MarketSectionsData | null
  sessions?: MarketSessionStatus[] | null
  onClickIndex?: (market: 'KR' | 'US') => void
}

export function TickerRibbon({ sections, sessions, onClickIndex }: Props) {
  const { palette } = useTheme()

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

      {/* 세션 배지 */}
      {sessions && sessions.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 6, paddingRight: 10, marginRight: 6, borderRightWidth: 1, borderRightColor: '#1e293b' }}>
          {sessions.map((s) => (
            <SessionPill key={`${s.market}-${s.label}`} session={s} />
          ))}
        </View>
      ) : null}

      {indices.length === 0 ? (
        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>
          지수 데이터를 불러오는 중…
        </Text>
      ) : (
        indices.map(({ market, item }) => {
          const color = marketColor(palette, market, item.changeRate)
          const points = item.periods?.[0]?.points ?? []
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
                    gap: 8,
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
              {points.length > 1 ? (
                <Sparkline points={points} width={48} height={14} color={color} palette={palette} />
              ) : null}
            </Pressable>
          )
        })
      )}
    </View>
  )
}

function SessionPill({ session }: { session: MarketSessionStatus }) {
  const open = session.isOpen
  const bg = open ? 'rgba(34,197,94,0.18)' : '#1e293b'
  const fg = open ? '#4ade80' : '#94a3b8'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: fg }} />
      <Text style={{ color: fg, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>
        {session.market} · {open ? 'OPEN' : (session.phase || 'CLOSED').toUpperCase()}
      </Text>
    </View>
  )
}
