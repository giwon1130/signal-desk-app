import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Briefcase, Images, Radio } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { marketColor, useTheme } from '../../theme'
import type { PortfolioSummary } from '../../types'
import { formatPrice, formatSignedPrice, formatSignedRate } from '../../utils'
import { PriceFlash } from '../../components/effects'

type LiveOf = (market: string, ticker: string, fallbackPrice: number, fallbackRate: number) =>
  { price: number; changeRate: number; live: boolean }

type Props = {
  portfolio: PortfolioSummary | null
  liveOf: LiveOf
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onImportPress: () => void
}

export function PortfolioSection({ portfolio, liveOf, onOpenDetail, onImportPress }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const positions = portfolio?.positions ?? []

  // 헤더 합계도 각 행과 같은 라이브 시세로 계산 → 헤더 총손익 = 보이는 행들의 합 (불일치 제거).
  const totals = useMemo(() => {
    let profit = 0
    let cost = 0
    for (const p of positions) {
      const live = liveOf(p.market, p.ticker, p.currentPrice, 0).price
      profit += (live - p.buyPrice) * p.quantity
      cost += p.buyPrice * p.quantity
    }
    return { profit, rate: cost > 0 ? (profit / cost) * 100 : 0 }
  }, [positions, liveOf])

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <Briefcase size={14} color={palette.blue} strokeWidth={2.5} />
          <Text style={styles.cardTitle}>내 보유</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.metaText}>{positions.length}개</Text>
          <Pressable
            onPress={onImportPress}
            accessibilityRole="button"
            accessibilityLabel="캡처로 보유 종목 등록"
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5,
              borderRadius: 8, backgroundColor: `${palette.brandAccent}15`, opacity: pressed ? 0.65 : 1,
            })}
          >
            <Images size={12} color={palette.brandAccent} strokeWidth={2.5} />
            <Text style={{ color: palette.brandAccent, fontSize: 10, fontWeight: '900' }}>캡처 등록</Text>
          </Pressable>
          {positions.length > 0 ? (
            <Text style={[styles.metaText, {
              color: totals.profit >= 0 ? palette.up : palette.down,
              fontWeight: '800',
            }]}>
              {formatSignedPrice(totals.profit, 'KR')} ({formatSignedRate(totals.rate)})
            </Text>
          ) : null}
        </View>
      </View>
      {positions.length ? (
        positions.map((p) => {
          const live = liveOf(p.market, p.ticker, p.currentPrice, 0)
          const livePrice = live.price
          const profitRate = p.buyPrice === 0 ? p.profitRate : ((livePrice - p.buyPrice) / p.buyPrice) * 100
          const profitAmount = (livePrice - p.buyPrice) * p.quantity
          const evaluationAmount = livePrice * p.quantity
          const profitColor = marketColor(palette, p.market, profitRate)
          return (
            <Pressable
              key={p.id}
              onPress={() => onOpenDetail(p.market, p.ticker, p.name)}
              style={({ pressed }) => [
                styles.summaryRow, pressed && { opacity: 0.6 },
              ]}
            >
              <View style={styles.metricLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.metricName}>{p.name}</Text>
                  {live.live ? <Radio size={10} color="#10b981" strokeWidth={3} /> : null}
                </View>
                <Text style={styles.metricState}>
                  {p.market} · {p.ticker} · {p.quantity}주 × {formatPrice(p.buyPrice, p.market)}
                </Text>
              </View>
              <View style={styles.summaryValueBox}>
                <PriceFlash value={live.live ? livePrice : null} upColor={palette.up} downColor={palette.down}>
                  <Text style={styles.metricScore}>{formatPrice(evaluationAmount, p.market)}</Text>
                </PriceFlash>
                <Text style={[styles.summaryDelta, { color: profitColor }]}>
                  {formatSignedRate(profitRate)}
                </Text>
                <Text style={[styles.cardNote, { color: profitColor }]}>
                  {formatSignedPrice(profitAmount, p.market)}
                </Text>
              </View>
            </Pressable>
          )
        })
      ) : (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 18 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>
            보유 중인 종목이 없어
          </Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center' }}>
            증권앱 잔고 캡처 한 장으로 한 번에 등록할 수 있어
          </Text>
          <Pressable
            onPress={onImportPress}
            style={({ pressed }) => ({
              marginTop: 3, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9,
              backgroundColor: `${palette.brandAccent}18`, opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ color: palette.brandAccent, fontSize: 11, fontWeight: '900' }}>캡처에서 가져오기</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
