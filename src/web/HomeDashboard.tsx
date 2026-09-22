import { memo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import type { AlertHistoryItem, HoldingPosition, MarketEvent, MarketSummaryData, MediaSummaryItem, MoverReason, PortfolioSummary, TopMoversResponse, WatchItem } from '../types'
import type { MarketPreference } from '../api/alertPreferences'
import { useTheme } from '../theme'
import { ResponsiveGrid } from './shared'
import { CompositeRiskWidget } from './widgets/CompositeRiskWidget'
import { TopMoversWidget } from './widgets/TopMoversWidget'
import { AlertTimelineWidget } from './widgets/AlertTimelineWidget'
import { WatchAlertsWidget } from './widgets/WatchAlertsWidget'
import { NewsWidget } from './widgets/NewsWidget'
import { BriefHero } from '../tabs/today_parts/BriefHero'
import { PreMarketDirectionCard } from '../tabs/today_parts/PreMarketDirectionCard'
import { HoldingMonitor } from '../tabs/today_parts/HoldingMonitor'
import { EventsCard } from '../tabs/today_parts/EventsCard'
import { forMarket } from '../utils/webPresentation'

type Props = {
  summary: MarketSummaryData | null
  positions: HoldingPosition[]
  watchlist: WatchItem[]
  alertHistory: AlertHistoryItem[]
  topMovers: TopMoversResponse | null
  portfolio: PortfolioSummary | null
  mediaSummaries: MediaSummaryItem[]
  moverReasons: MoverReason[]
  upcomingEvents: MarketEvent[]
  marketPreference: MarketPreference
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onUpgrade?: () => void
}

export const HomeDashboard = memo(function HomeDashboard(props: Props) {
  const { palette } = useTheme()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const summary = props.summary ? { ...props.summary,
    watchAlerts: forMarket(props.summary.watchAlerts ?? [], props.marketPreference),
  } : null
  const positions = forMarket(props.positions, props.marketPreference)
  return (
    <View style={{ gap: 24, minWidth: 0 }}>
      <View style={{ gap: 12 }}>
        <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 21 }}>
          오늘의 핵심을 먼저 확인하세요. 자세한 시장 흐름은 브리프 안에서 펼쳐 볼 수 있습니다.
        </Text>
        <BriefHero items={props.mediaSummaries} briefing={props.summary?.briefing ?? null}
          marketPreference={props.marketPreference}
          onTickerPress={(ticker) => props.onOpenDetail(/^\d{6}$/.test(ticker) ? 'KR' : 'US', ticker)} />
      </View>

      <View style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={{ color: palette.ink, fontSize: 18, fontWeight: '700' }}>내 종목 점검</Text>
        <ResponsiveGrid>
          <HoldingMonitor monitorTargets={positions} sessions={props.summary?.marketSessions ?? []} onOpenDetail={props.onOpenDetail} />
          <WatchAlertsWidget summary={summary} palette={palette} onOpenDetail={props.onOpenDetail} />
        </ResponsiveGrid>
      </View>

      <ResponsiveGrid>
        <EventsCard events={props.upcomingEvents} />
        <AlertTimelineWidget history={forMarket(props.alertHistory, props.marketPreference)} palette={palette} onOpenDetail={props.onOpenDetail} />
      </ResponsiveGrid>

      <View style={{ borderTopWidth: 1, borderColor: palette.border, paddingTop: 16, gap: 16 }}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }}
          onPress={() => setDetailsOpen((value) => !value)}
          style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>시장 지표와 뉴스</Text>
            <Text style={{ color: palette.inkMuted, fontSize: 12 }}>위험 지표, 주요 뉴스와 크게 움직인 종목을 확인합니다.</Text>
          </View>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>{detailsOpen ? '닫기' : '열기'}</Text>
          {detailsOpen ? <ChevronUp size={18} color={palette.inkMuted} /> : <ChevronDown size={18} color={palette.inkMuted} />}
        </Pressable>
        {detailsOpen ? <>
          <ResponsiveGrid>
            <CompositeRiskWidget summary={props.summary} palette={palette} />
            <NewsWidget summary={props.summary} palette={palette} marketPreference={props.marketPreference} />
          </ResponsiveGrid>
          {props.marketPreference !== 'US' && props.summary?.preMarketDirection ? (
            <PreMarketDirectionCard data={props.summary.preMarketDirection} stats={props.summary.preMarketForecastStats} onUpgrade={props.onUpgrade} />
          ) : null}
          <TopMoversWidget topMovers={props.topMovers} moverReasons={props.moverReasons}
            marketPreference={props.marketPreference} palette={palette} onOpenDetail={props.onOpenDetail} />
        </> : null}
      </View>
    </View>
  )
})
