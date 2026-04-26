/**
 * 휴장(주말/공휴일) 시 메인 컬럼 상단에 띄우는 컴팩트 배너.
 * - TickerRibbon 의 SessionPill 만으론 시각적으로 약해서 따로 한 줄.
 * - 정상 거래일(둘 중 하나라도 열림)이면 배너 미표시.
 */
import { Text, View } from 'react-native'
import { useTheme } from '../../theme'
import type { TradingDayStatus } from '../../types'

export function TradingDayBanner({ status }: { status: TradingDayStatus }) {
  const { palette } = useTheme()
  const closed = !status.krOpen && !status.usOpen
  if (!closed) return null
  const isWeekend = status.isWeekend
  // 주말은 노랑/앰버, 휴장은 빨강 톤
  const bg = isWeekend ? '#fef3c7' : '#fee2e2'
  const border = isWeekend ? '#fcd34d' : '#fecaca'
  const ink = isWeekend ? '#92400e' : '#991b1b'
  const sub = isWeekend ? '#a16207' : '#b91c1c'
  // 다크 모드 대비
  const isDark = palette.scheme === 'dark'
  const bgDark = isWeekend ? 'rgba(252, 211, 77, 0.12)' : 'rgba(252, 165, 165, 0.12)'
  const borderDark = isWeekend ? 'rgba(252, 211, 77, 0.35)' : 'rgba(252, 165, 165, 0.35)'
  return (
    <View
      style={{
        backgroundColor: isDark ? bgDark : bg,
        borderColor: isDark ? borderDark : border,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isDark ? (isWeekend ? '#fcd34d' : '#fca5a5') : ink }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: isDark ? palette.ink : ink, fontSize: 13, fontWeight: '800' }}>{status.headline}</Text>
        <Text style={{ color: isDark ? palette.inkMuted : sub, fontSize: 11, fontWeight: '600' }}>
          {status.advice}
        </Text>
      </View>
      {status.nextTradingDay ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: isDark ? palette.inkFaint : sub, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>다음 거래일</Text>
          <Text style={{ color: isDark ? palette.ink : ink, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {status.nextTradingDay}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
