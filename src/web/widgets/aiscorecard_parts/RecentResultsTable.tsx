import { Pressable, Text, View } from 'react-native'
import { BarChart3 } from 'lucide-react-native'
import type { RecommendationExecutionLog } from '../../../types'
import { type Palette } from '../../../theme'
import { formatSignedRate } from '../../../utils'
import { Widget, deltaColor } from '../../shared'

type Props = {
  results: RecommendationExecutionLog[]
  palette: Palette
  onOpenDetail: (m: string, t: string, n?: string) => void
}

/**
 * 최근 결과 로그 테이블 — 종목/날짜/상태/기대/실현/내 선택 6 컬럼.
 */
export function RecentResultsTable({ results, palette, onOpenDetail }: Props) {
  return (
    <Widget
      palette={palette}
      title="최근 결과 로그"
      icon={<BarChart3 size={13} color={palette.inkSub} strokeWidth={2.5} />}
      meta={`${results.length}건`}
    >
      {results.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>아직 실현 결과 없음</Text>
        </View>
      ) : (
        <View>
          <View style={{
            flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6,
            borderBottomWidth: 1, borderBottomColor: palette.border, gap: 8,
          }}>
            <Text style={{ flex: 2, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>종목</Text>
            <Text style={{ width: 70, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>날짜</Text>
            <Text style={{ width: 70, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>상태</Text>
            <Text style={{ width: 80, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' }}>기대</Text>
            <Text style={{ width: 80, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' }}>실현</Text>
            <Text style={{ width: 60, color: palette.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' }}>내 선택</Text>
          </View>
          {results.map((l) => {
            const exp = l.expectedReturnRate
            const rea = l.realizedReturnRate
            return (
              <Pressable
                key={`${l.date}-${l.market}-${l.ticker}-${l.stage}`}
                onPress={() => onOpenDetail(l.market, l.ticker, l.name)}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, gap: 8,
                    backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  }]
                }}
              >
                <View style={{ flex: 2, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>
                    {l.name}
                  </Text>
                  <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
                    {l.market} · {l.ticker}
                  </Text>
                </View>
                <Text style={{ width: 70, color: palette.inkSub, fontSize: 11, fontWeight: '600' }}>{l.date}</Text>
                <Text style={{ width: 70, color: palette.inkMuted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                  {l.status}
                </Text>
                <Text style={{ width: 80, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right', color: deltaColor(exp, palette) }}>
                  {exp == null ? '—' : formatSignedRate(exp)}
                </Text>
                <Text style={{ width: 80, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], textAlign: 'right', color: deltaColor(rea, palette) }}>
                  {rea == null ? '—' : formatSignedRate(rea)}
                </Text>
                <View style={{ width: 60, alignItems: 'flex-end', justifyContent: 'center' }}>
                  {l.userStatus && l.userStatus !== 'NEW' ? (
                    <View style={{ backgroundColor: palette.blueSoft, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ color: palette.blue, fontSize: 9, fontWeight: '800' }}>{l.userStatus}</Text>
                    </View>
                  ) : (
                    <Text style={{ color: palette.inkFaint, fontSize: 10 }}>—</Text>
                  )}
                </View>
              </Pressable>
            )
          })}
        </View>
      )}
    </Widget>
  )
}
