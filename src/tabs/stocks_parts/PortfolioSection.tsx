import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Briefcase, Images, Radio } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { marketColor, useTheme } from '../../theme'
import type { PortfolioSummary } from '../../types'
import { formatPrice, formatSignedPrice, formatSignedRate } from '../../utils'
import { PriceFlash } from '../../components/effects'
import { portfolioTotals } from '../../utils/portfolioTotals'

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
  const totals = useMemo(() => portfolioTotals(positions, (p) => liveOf(p.market, p.ticker, p.currentPrice, 0).price), [positions, liveOf])

  return (
    <View style={styles.card}>
      <View style={[styles.sectionHeaderRow, { flexWrap: 'wrap', rowGap: 8 }]}>
        <View style={styles.cardTitleRow}>
          <Briefcase size={18} color={palette.teal} strokeWidth={2.3} />
          <Text style={styles.cardTitle}>내 포트폴리오</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.metaText}>{positions.length}개</Text>
          <Pressable
            onPress={onImportPress}
            accessibilityRole="button"
            accessibilityLabel="캡처로 보유 종목 등록"
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, minHeight: 44,
              borderRadius: 12, backgroundColor: palette.tealSoft, opacity: pressed ? 0.65 : 1,
            })}
          >
            <Images size={14} color={palette.teal} strokeWidth={2.5} />
            <Text style={{ color: palette.teal, fontSize: 11, fontWeight: '700' }}>캡처 등록</Text>
          </Pressable>
        </View>
      </View>
      {totals.length > 0 ? (
        <View style={{ gap: 10 }}>
          {totals.map((total) => (
            <View key={total.market} style={{ backgroundColor: palette.surfaceAlt, borderRadius: 16, padding: 16, gap: 6 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{total.market === 'KR' ? '한국 · 원화 평가액' : '미국 · 달러 평가액'}</Text>
              <Text style={{ color: palette.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}>
                {total.invalid ? '가격 확인 필요' : formatPrice(total.value, total.market)}
              </Text>
              <Text style={{ color: total.invalid ? palette.inkMuted : marketColor(palette, total.market, total.profit), fontSize: 13, fontWeight: '700' }}>
                {total.invalid ? '일부 가격이 없어 합계를 표시하지 않았어' : formatSignedPrice(total.profit, total.market) + ' (' + formatSignedRate(total.rate) + ')'}
              </Text>
            </View>
          ))}
          {totals.length > 1 ? <Text style={{ color: palette.inkMuted, fontSize: 11 }}>환율 환산 전 금액이라 통화별로 나눠 보여줘</Text> : null}
        </View>
      ) : null}
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
