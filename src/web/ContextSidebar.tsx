import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { ArrowRight, Bell, Briefcase, Radio, Sparkles, Star, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { AiRecommendationData, DailyFortune, PortfolioSummary, WatchItem } from '../types'
import { marketColor, useTheme, type Palette } from '../theme'
import { formatCompactNumber, formatSignedRate } from '../utils'
import { useLivePrices } from '../hooks/useLivePrices'
import { StanceTag } from './shared'

/**
 * 우측 고정 컨텍스트 사이드바.
 *
 * - TradingView 의 "Details/Watchlist right panel" 컨셉.
 *   어느 탭에 있든 항상 보이는 개인 컨텍스트 (관심종목 live / 포트폴리오 / 최근 알림).
 * - 탭 간 이동해도 사라지지 않음. 컨텐츠는 같고 메인이 바뀌는 구조.
 * - 관심종목은 KR 만 WS 로 실시간, US 는 스냅샷 그대로. `useLivePrices` 재사용.
 *
 * 좁은 폭(1279px 이하) 에선 숨김 — 부모 WebLayout 이 조건부 렌더.
 */

type Props = {
  watchlist: WatchItem[]
  portfolio: PortfolioSummary | null
  aiRecommendation: AiRecommendationData | null
  fortune?: DailyFortune | null
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onGotoStocks: () => void
  onGotoAi: () => void
}

const CONTEXT_WIDTH = 320
const WATCHLIST_CAP = 7
const RECENT_AI_CAP = 5

export function ContextSidebar(props: Props) {
  const { watchlist, portfolio, aiRecommendation, fortune, onOpenDetail, onGotoStocks, onGotoAi } = props
  const { palette } = useTheme()

  const krTickers = useMemo(
    () => watchlist.filter((w) => w.market === 'KR').map((w) => w.ticker),
    [watchlist],
  )
  const livePrices = useLivePrices(krTickers)

  const topWatch = watchlist.slice(0, WATCHLIST_CAP)
  const topAi    = aiRecommendation?.executionLogs?.slice(0, RECENT_AI_CAP) ?? []
  const topHolding = portfolio?.positions?.[0] ?? null

  return (
    <View
      style={{
        width: CONTEXT_WIDTH,
        borderLeftWidth: 1,
        borderLeftColor: palette.border,
        backgroundColor: palette.surface,
      }}
    >
      <ScrollView contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 14, gap: 18 }}>
        {/* ── 관심종목 ─────────────────────────────── */}
        <Section
          icon={<Star size={13} color="#f59e0b" strokeWidth={2.5} fill={watchlist.length ? '#f59e0b' : 'none'} />}
          title="관심종목"
          meta={`${watchlist.length}개`}
          onMoreLabel="전체 보기"
          onMore={onGotoStocks}
          palette={palette}
        >
          {topWatch.length === 0 ? (
            <EmptyRow text="관심종목을 추가해봐" palette={palette} />
          ) : (
            topWatch.map((w) => {
              const live = w.market === 'KR' ? livePrices[w.ticker] : null
              const price = live?.price ?? w.price
              const rate  = live?.changeRate ?? w.changeRate
              const isLive = !!live
              const color = marketColor(palette, w.market, rate)
              return (
                <Pressable
                  key={`${w.market}-${w.ticker}`}
                  onPress={() => onOpenDetail(w.market, w.ticker, w.name)}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text
                        numberOfLines={1}
                        style={{ color: palette.ink, fontSize: 12, fontWeight: '800', flexShrink: 1 }}
                      >
                        {w.name}
                      </Text>
                      {isLive ? <Radio size={8} color="#10b981" strokeWidth={3} /> : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
                        {w.market} · {w.ticker}
                      </Text>
                      {w.stance ? <StanceTag stance={w.stance} palette={palette} size="xs" /> : null}
                    </View>
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
                      {formatCompactNumber(price)}
                    </Text>
                    <Text
                      style={{
                        color,
                        fontSize: 11,
                        fontWeight: '800',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatSignedRate(rate)}
                    </Text>
                  </View>
                </Pressable>
              )
            })
          )}
        </Section>

        {/* ── 포트폴리오 요약 ──────────────────────── */}
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
                  {formatCompactNumber(portfolio.totalValue)}
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
                    ({formatCompactNumber(portfolio.totalProfit)})
                  </Text>
                </View>
              </View>
              {topHolding ? (
                <Pressable
                  onPress={() => onOpenDetail(topHolding.market, topHolding.ticker, topHolding.name)}
                  style={(state) => {
                    const hovered = (state as { hovered?: boolean }).hovered
                    return [{
                      marginTop: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 7,
                      borderRadius: 7,
                      backgroundColor: hovered ? palette.surfaceAlt : palette.bg,
                      borderWidth: 1,
                      borderColor: palette.border,
                    }]
                  }}
                >
                  <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                    TOP
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}
                  >
                    {topHolding.name}
                  </Text>
                  <Text
                    style={{
                      color: marketColor(palette, topHolding.market, topHolding.profitRate),
                      fontSize: 11,
                      fontWeight: '800',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatSignedRate(topHolding.profitRate)}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <EmptyRow text="보유 종목이 없어" palette={palette} />
          )}
        </Section>

        {/* ── 최근 AI 추천 ─────────────────────────── */}
        <Section
          icon={<Bell size={13} color={palette.purple} strokeWidth={2.5} />}
          title="최근 AI 추천"
          meta={topAi.length ? `${topAi.length}건` : '—'}
          onMoreLabel="전체 로그"
          onMore={onGotoAi}
          palette={palette}
        >
          {topAi.length === 0 ? (
            <EmptyRow text="최근 추천이 없어" palette={palette} />
          ) : (
            topAi.map((log) => (
              <Pressable
                key={`${log.date}-${log.market}-${log.ticker}-${log.stage}`}
                onPress={() => onOpenDetail(log.market, log.ticker, log.name)}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    paddingHorizontal: 8,
                    paddingVertical: 7,
                    borderRadius: 7,
                    gap: 2,
                    backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  }]
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: palette.ink, fontSize: 12, fontWeight: '800', flex: 1 }}
                  >
                    {log.name}
                  </Text>
                  <Text
                    style={{
                      color: palette.purple,
                      fontSize: 9,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                    }}
                  >
                    {log.stage}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600' }}
                >
                  {log.market} · {log.ticker} · {log.status}
                </Text>
              </Pressable>
            ))
          )}
        </Section>

        {/* ── 오늘의 운 ──────────────────────────── */}
        {fortune ? <FortuneMini fortune={fortune} palette={palette} /> : null}
      </ScrollView>
    </View>
  )
}

function FortuneMini({ fortune, palette }: { fortune: DailyFortune; palette: Palette }) {
  const toneColor = fortune.overallTone === 'good' ? palette.up : fortune.overallTone === 'bad' ? palette.down : palette.orange
  const toneSoft = fortune.overallTone === 'good' ? palette.upSoft : fortune.overallTone === 'bad' ? palette.downSoft : palette.orangeSoft
  return (
    <View
      style={{
        backgroundColor: toneSoft,
        borderRadius: 10,
        padding: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Sparkles size={13} color={toneColor} strokeWidth={2.5} />
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800', flex: 1 }}>오늘의 운</Text>
        <Text style={{ color: toneColor, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
          {fortune.overallLabel} · {fortune.overallScore}
        </Text>
      </View>
      <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', lineHeight: 16 }} numberOfLines={2}>
        {fortune.headline}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <FortuneBadge label="재물" score={fortune.wealthScore} palette={palette} />
        <FortuneBadge label="거래" score={fortune.tradeScore} palette={palette} />
        <FortuneBadge label="인내" score={fortune.patienceScore} palette={palette} />
      </View>
    </View>
  )
}

function FortuneBadge({ label, score, palette }: { label: string; score: number; palette: Palette }) {
  const color = score >= 70 ? palette.up : score <= 40 ? palette.down : palette.inkSub
  return (
    <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1, borderColor: palette.border }}>
      <Text style={{ color: palette.inkMuted, fontSize: 9, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{score}</Text>
    </View>
  )
}

/* ─────────────────────────────────────────────────────────── */

type SectionProps = {
  icon: React.ReactNode
  title: string
  meta?: string
  onMore?: () => void
  onMoreLabel?: string
  palette: ReturnType<typeof useTheme>['palette']
  children: React.ReactNode
}
function Section({ icon, title, meta, onMore, onMoreLabel, palette, children }: SectionProps) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 }}>
        {icon}
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>{title}</Text>
        {meta ? (
          <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>{meta}</Text>
        ) : null}
        <View style={{ flex: 1 }} />
        {onMore ? (
          <Pressable
            onPress={onMore}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered
              return [{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingVertical: 2,
                paddingHorizontal: 4,
                borderRadius: 5,
                backgroundColor: hovered ? palette.blueSoft : 'transparent',
              }]
            }}
          >
            <Text style={{ color: palette.blue, fontSize: 10, fontWeight: '800' }}>
              {onMoreLabel ?? '더 보기'}
            </Text>
            <ArrowRight size={9} color={palette.blue} strokeWidth={3} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ gap: 1 }}>{children}</View>
    </View>
  )
}

function EmptyRow({ text, palette }: { text: string; palette: ReturnType<typeof useTheme>['palette'] }) {
  return (
    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
      <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '600' }}>{text}</Text>
    </View>
  )
}

export const CONTEXT_SIDEBAR_WIDTH = CONTEXT_WIDTH
