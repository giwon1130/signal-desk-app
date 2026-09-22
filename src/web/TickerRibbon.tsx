import { Platform, Pressable, Text, View } from 'react-native'
import type { MarketSectionsData, IndexMetric, MarketSessionStatus } from '../types'
import { marketColor, useTheme } from '../theme'
import { formatNumber, formatSignedRate } from '../utils'
import { Sparkline } from './shared'
import { quoteState } from '../utils/webPresentation'

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
  /** 시장 선호 — KR/US 선택 시 해당 시장 지수만 노출 (IndexPulse 와 동일 규칙). */
  marketPreference?: 'KR' | 'US' | 'BOTH'
  onClickIndex?: (market: 'KR' | 'US', label: string) => void
}

export function TickerRibbon({ sections, sessions, marketPreference = 'BOTH', onClickIndex }: Props) {
  const { palette } = useTheme()
  const state = quoteState(sections?.generatedAt)

  const showKr = marketPreference !== 'US'
  const showUs = marketPreference !== 'KR'
  const indices: Array<{ market: 'KR' | 'US'; item: IndexMetric }> = []
  if (showKr && sections?.koreaMarket?.indices) {
    for (const it of sections.koreaMarket.indices) indices.push({ market: 'KR', item: it })
  }
  if (showUs && sections?.usMarket?.indices) {
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
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        ...(Platform.OS === 'web' ? ({ overflowX: 'auto', overflowY: 'hidden' } as object) : null),
      }}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingRight: 10, borderRightWidth: 1, borderRightColor: '#1e293b', marginRight: 10,
      }}>
        <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}>
          {state === 'missing' ? '시각 미확인' : state === 'stale' ? '이전 집계' : '최근 집계'}
        </Text>
      </View>

      {/* 세션 배지 */}
      {sessions && sessions.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 6, paddingRight: 10, marginRight: 6, borderRightWidth: 1, borderRightColor: '#1e293b' }}>
          {sessions.filter((s) => marketPreference === 'BOTH' || s.market === marketPreference).map((s) => (
            <SessionPill key={`${s.market}-${s.label}`} session={s} />
          ))}
        </View>
      ) : null}

      {indices.length === 0 ? (
        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>
          표시할 지수 자료가 없습니다
        </Text>
      ) : (
        indices.map(({ market, item }) => {
          const color = marketColor(palette, market, item.changeRate)
          const points = item.periods?.[0]?.points ?? []
          return (
            <Pressable
              key={`${market}-${item.label}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} 상세 차트`}
              onPress={() => onClickIndex?.(market, item.label)}
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
                    backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                    flexShrink: 0,
                    minHeight: 36,
                  },
                ]
              }}
            >
              <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '600' }}>
                {item.label}
              </Text>
              <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {Number.isFinite(item.value) && item.value > 0 ? formatNumber(item.value, 2) : '—'}
              </Text>
              <Text style={{ color, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {Number.isFinite(item.changeRate) ? formatSignedRate(item.changeRate) : '—'}
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
