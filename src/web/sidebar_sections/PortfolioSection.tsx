import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Briefcase, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { PortfolioSummary } from '../../types'
import { marketColor, type Palette } from '../../theme'
import { formatPrice, formatSignedPrice, formatSignedRate } from '../../utils'
import { EmptyRow, Section } from './Section'

export const HOLDING_CAP = 5

type Props = {
  portfolio: PortfolioSummary | null
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onGotoStocks: () => void
  palette: Palette
}

export function PortfolioSection({ portfolio, onOpenDetail, onGotoStocks, palette }: Props) {
  // 평가금액 큰 순으로 Top 5 — 1개만 보여주는 건 사용자 컨텍스트로 부족.
  const topHoldings = useMemo(() => {
    const positions = portfolio?.positions ?? []
    return [...positions]
      .sort((a, b) => (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity))
      .slice(0, HOLDING_CAP)
  }, [portfolio])

  return (
    <Section
      icon={<Briefcase size={13} color={palette.blue} strokeWidth={2.5} />}
      title="포트폴리오"
      meta={portfolio ? `${portfolio.positions.length}개` : '—'}
      onMoreLabel="전체 보기"
      onMore={onGotoStocks}
      palette={palette}
    >
      {portfolio && portfolio.positions.length ? (
        <>
          <View style={{ paddingHorizontal: 4, paddingVertical: 6, gap: 3 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
              평가금액
            </Text>
            <Text
              style={{
                color: palette.ink,
                fontSize: 17,
                fontWeight: '800',
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatPrice(portfolio.totalValue, 'KR')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              {portfolio.totalProfitRate >= 0 ? (
                <TrendingUp size={11} color={palette.up} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={11} color={palette.down} strokeWidth={2.5} />
              )}
              <Text
                style={{
                  color: portfolio.totalProfitRate >= 0 ? palette.up : palette.down,
                  fontSize: 11,
                  fontWeight: '800',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatSignedRate(portfolio.totalProfitRate)}
              </Text>
              <Text
                style={{
                  color: portfolio.totalProfit >= 0 ? palette.up : palette.down,
                  fontSize: 11,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}
              >
                ({formatSignedPrice(portfolio.totalProfit, 'KR')})
              </Text>
            </View>
          </View>
          {topHoldings.length > 0 ? (
            <View style={{ marginTop: 6, gap: 4 }}>
              {topHoldings.map((h) => (
                <Pressable
                  key={`${h.market}-${h.ticker}`}
                  onPress={() => onOpenDetail(h.market, h.ticker, h.name)}
                  style={(state) => {
                    const hovered = (state as { hovered?: boolean }).hovered
                    return [{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 7,
                      borderRadius: 7,
                      backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                    }]
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}
                    >
                      {h.name}
                    </Text>
                    <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
                      {h.market} · {h.quantity}주 × {formatPrice(h.buyPrice, h.market)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        color: palette.ink,
                        fontSize: 12,
                        fontWeight: '700',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatPrice(h.currentPrice, h.market)}
                    </Text>
                    <Text
                      style={{
                        color: marketColor(palette, h.market, h.profitRate),
                        fontSize: 11,
                        fontWeight: '800',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatSignedRate(h.profitRate)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <EmptyRow text="보유 중인 종목이 없어" hint="종목 상세에서 매수가 · 수량 입력해 등록" palette={palette} />
      )}
    </Section>
  )
}
