import { useMemo } from 'react'
import { ScrollView, View } from 'react-native'
import type { AiRecommendationData, DailyFortune, PortfolioSummary, WatchItem } from '../types'
import { useTheme } from '../theme'
import { useLivePrices } from '../hooks/useLivePrices'
import { WatchlistSection } from './sidebar_sections/WatchlistSection'
import { PortfolioSection } from './sidebar_sections/PortfolioSection'
import { RecentAiSection } from './sidebar_sections/RecentAiSection'
import { FortuneMini } from './sidebar_sections/FortuneMini'

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

export function ContextSidebar(props: Props) {
  const { watchlist, portfolio, aiRecommendation, fortune, onOpenDetail, onGotoStocks, onGotoAi } = props
  const { palette } = useTheme()

  const krTickers = useMemo(
    () => watchlist.filter((w) => w.market === 'KR').map((w) => w.ticker),
    [watchlist],
  )
  const livePrices = useLivePrices(krTickers)

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
        <WatchlistSection
          watchlist={watchlist}
          livePrices={livePrices}
          onOpenDetail={onOpenDetail}
          onGotoStocks={onGotoStocks}
          palette={palette}
        />
        <PortfolioSection
          portfolio={portfolio}
          onOpenDetail={onOpenDetail}
          onGotoStocks={onGotoStocks}
          palette={palette}
        />
        <RecentAiSection
          aiRecommendation={aiRecommendation}
          onOpenDetail={onOpenDetail}
          onGotoAi={onGotoAi}
          palette={palette}
        />
        {fortune ? <FortuneMini fortune={fortune} palette={palette} /> : null}
      </ScrollView>
    </View>
  )
}

export const CONTEXT_SIDEBAR_WIDTH = CONTEXT_WIDTH
